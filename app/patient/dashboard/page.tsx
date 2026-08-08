"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, updateDoc, doc } from "firebase/firestore";
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';

// Map needs to be dynamically imported with SSR disabled because it relies on window object
const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500">Loading Map...</div>
});

type Step = "dashboard" | "symptoms" | "followup" | "location" | "results" | "records";

export default function PatientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("dashboard");

  // Symptom form
  const [symptoms, setSymptoms] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Follow-up
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState("");

  // Results
  const [triage, setTriage] = useState<any>(null);
  const [ticketId, setTicketId] = useState<string>("");
  const [isMild, setIsMild] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string>("");
  const [bookedDoctor, setBookedDoctor] = useState<any>(null);
  const [bookedStatus, setBookedStatus] = useState<"none" | "pending_confirmation" | "confirmed">("none");
  const [consultationType, setConsultationType] = useState<"in-person" | "google-meet" | "platform-video" | null>(null);

  // Previous records
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  // Listen to ticket updates for confirmation
  useEffect(() => {
    if (!ticketId || bookedStatus === "none") return;
    const unsub = onSnapshot(doc(db, "Tickets", ticketId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === "booked") {
          setBookedStatus("confirmed");
        }
      }
    });
    return () => unsub();
  }, [ticketId, bookedStatus]);


  const fetchDoctors = async (triageResult: any, loc: string) => {
    setLoadingDoctors(true);
    try {
      // Fetch all users who are doctors or hospitals
      const allUsersSnap = await getDocs(
        query(collection(db, "Users"), where("role", "in", ["doctor", "hospital"]))
      );
      const allDoctorUsers = allUsersSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));

      // Fetch all doctor profiles
      const profilesSnap = await getDocs(collection(db, "DoctorProfiles"));

      const found: any[] = [];

      profilesSnap.docs.forEach(p => {
        const pData = p.data() as any;
        const matchingUser = allDoctorUsers.find(u => u.uid === p.id);
        if (!matchingUser) return;

        // Simplify nearby logic based on the user's selected zone for now
        const isNearby = matchingUser.location === loc || !loc; 
        const isOnline = pData.isOnline || matchingUser.isOnline;

        // Show if nearby OR if they offer online consultations (always visible)
        if (isNearby || isOnline) {
          found.push({
            uid: p.id,
            name: matchingUser.name,
            role: matchingUser.role,
            specialty: pData.specialty,
            location: matchingUser.location,
            slots: (pData.available_slots || []).filter((s: any) => !s.booked),
            isOnline,
            meetLink: pData.meetLink,
            isNearby,
          });
        }
      });

      // Sort: nearby first, then online
      found.sort((a, b) => {
        if (a.isNearby && !b.isNearby) return -1;
        if (!a.isNearby && b.isNearby) return 1;
        return 0;
      });

      // If still nothing found (no nearby, no online), show everyone
      if (found.length === 0) {
        profilesSnap.docs.forEach(p => {
          const pData = p.data() as any;
          const matchingUser = allDoctorUsers.find(u => u.uid === p.id);
          if (!matchingUser) return;
          found.push({
            uid: p.id,
            name: matchingUser.name,
            role: matchingUser.role,
            specialty: pData.specialty,
            location: matchingUser.location,
            slots: (pData.available_slots || []).filter((s: any) => !s.booked),
            isOnline: pData.isOnline || matchingUser.isOnline,
            meetLink: pData.meetLink,
            isNearby: false,
          });
        });
      }

      setDoctors(found);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleInitialSubmit = async (skipFollowup = false) => {
    setIsSubmitting(true);
    setError("");

    const finalSymptoms = questions.length > 0 && !skipFollowup
      ? `Original: ${symptoms}\nFollow-up Answers: ${answers}`
      : symptoms;

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: finalSymptoms,
          location: locationName || "Sri Lanka",
          skip_followup: skipFollowup,
          patient_uid: user?.uid || "guest",
          patient_name: user?.name || "Patient",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Triage failed");

      if (data.needs_clarification) {
        setQuestions(data.questions || []);
        setStep("followup");
      } else {
        setTriage(data.triage);
        setTicketId(data.ticketId);
        setIsMild(data.isMild);
        // Ask for precise location via map before finding doctors
        setStep("location");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSubmit = async () => {
    await fetchDoctors(triage, locationName);
    setStep("results");
  };

  const handleBook = async (docObj: any, slot: any, type: "in-person" | "google-meet" | "platform-video") => {
    if (!ticketId) return;
    try {
      await updateDoc(doc(db, "Tickets", ticketId), {
        status: "pending_confirmation",
        assigned_doc_uid: docObj.uid,
        appointment_time: slot.time,
        consultation_type: type,
        // E.g. "Room 1" if available in slot, else default to "Room 1"
        room: slot.room || "Room 1", 
      });
      setBookingSlot(slot.time);
      setBookedDoctor(docObj);
      setConsultationType(type);
      setBookedStatus("pending_confirmation");
    } catch (e) {
      alert("Booking failed.");
    }
  };

  const fetchRecords = async () => {
    if (!user?.uid) return;
    setLoadingRecords(true);
    setStep("records");
    try {
      const q = query(collection(db, "MedicalLogs"), where("patient_uid", "==", user.uid));
      const snap = await getDocs(q);
      setRecords(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecords(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* ── DASHBOARD HOME ── */}
        {step === "dashboard" && (
          <div>
            <div className="mb-10">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Welcome back</p>
              <h1 className="text-5xl font-black tracking-tight">
                {user.name?.split(" ")[0]}<span className="text-red-600">.</span>
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                onClick={() => setStep("symptoms")}
                className="group p-8 rounded-3xl bg-red-600 hover:bg-red-500 text-left transition-all shadow-xl shadow-red-900/30 hover:scale-[1.02]"
              >
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-2xl font-black mb-2">Find a Doctor</h2>
                <p className="text-red-200 text-sm">Describe your symptoms and get AI-matched to the right specialist.</p>
                <div className="mt-6 text-white font-bold text-sm group-hover:translate-x-1 transition-transform">
                  Start Now →
                </div>
              </button>

              <button
                onClick={fetchRecords}
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-all hover:scale-[1.02]"
              >
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-2xl font-black mb-2">My Medical Records</h2>
                <p className="text-gray-400 text-sm">View your previous consultations, diagnoses, and prescriptions.</p>
                <div className="mt-6 text-gray-400 font-bold text-sm group-hover:text-white group-hover:translate-x-1 transition-all">
                  View Records →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── SYMPTOM FORM ── */}
        {step === "symptoms" && (
          <div>
            <button onClick={() => setStep("dashboard")} className="text-gray-500 hover:text-white text-sm font-bold mb-8 flex items-center gap-2 transition">
              ← Back
            </button>
            <h2 className="text-4xl font-black mb-2">Tell us how you feel</h2>
            <p className="text-gray-400 mb-8">Our AI will analyse your symptoms and recommend the right specialist.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Describe your symptoms</label>
                <textarea
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  rows={5}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition text-white placeholder-gray-600 resize-none"
                  placeholder="E.g. I have been having a sharp chest pain for 2 days, especially when breathing..."
                />
              </div>

              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/40 text-red-300 rounded-xl text-sm">{error}</div>
              )}

              <button
                disabled={!symptoms || isSubmitting}
                onClick={() => handleInitialSubmit(false)}
                className="w-full py-5 bg-red-600 hover:bg-red-500 font-black text-lg rounded-2xl transition disabled:opacity-40 shadow-lg shadow-red-900/30"
              >
                {isSubmitting ? "Analysing symptoms..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* ── FOLLOW-UP QUESTIONS ── */}
        {step === "followup" && (
          <div>
            <h2 className="text-4xl font-black mb-2">A few more questions</h2>
            <p className="text-gray-400 mb-8">Our AI needs a bit more information to accurately match you.</p>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-6">
              <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">AI asks:</p>
              <ul className="space-y-3">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-white">
                    <span className="text-red-500 font-black">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            <textarea
              value={answers}
              onChange={e => setAnswers(e.target.value)}
              rows={4}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition text-white placeholder-gray-600 resize-none mb-4"
              placeholder="Type your answers here..."
            />

            <div className="flex gap-4">
              <button
                disabled={!answers || isSubmitting}
                onClick={() => handleInitialSubmit(false)}
                className="flex-1 py-4 bg-red-600 hover:bg-red-500 font-black rounded-2xl transition disabled:opacity-40"
              >
                {isSubmitting ? "Analysing..." : "Submit Answers"}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => handleInitialSubmit(true)}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 font-bold rounded-2xl transition disabled:opacity-40 text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── LOCATION MAP ── */}
        {step === "location" && (
          <div className="animate-fade-in">
             <h2 className="text-4xl font-black mb-2">Where are you?</h2>
             <p className="text-gray-400 mb-8">Drop a pin on the map or select your zone to find nearby doctors.</p>

             <div className="mb-6">
                <MapWithNoSSR onLocationSelected={(lat, lng) => setLatLng({lat, lng})} />
             </div>

             <div className="mb-6">
                <label className="block text-sm font-bold text-gray-400 mb-2">Or select your zone (Colombo)</label>
                <select
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  className="w-full px-5 py-4 bg-black border border-white/10 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition text-white"
                >
                  <option value="" disabled>Select your zone</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                    <option key={n} value={`Colombo ${n}`}>Colombo {n}</option>
                  ))}
                </select>
             </div>

             <button
                onClick={handleLocationSubmit}
                className="w-full py-5 bg-red-600 hover:bg-red-500 font-black text-lg rounded-2xl transition shadow-lg shadow-red-900/30"
              >
                Find Doctors
              </button>
          </div>
        )}

        {/* ── DOCTOR RESULTS ── */}
        {step === "results" && (
          <div>
            {bookedStatus !== "none" ? (
              <div className="text-center py-12 max-w-lg mx-auto bg-white/5 border border-white/10 p-8 rounded-3xl">
                {bookedStatus === "pending_confirmation" ? (
                  <>
                    <div className="text-6xl mb-6 animate-pulse">⏳</div>
                    <h2 className="text-3xl font-black mb-3 text-yellow-500">Pending Confirmation</h2>
                    <p className="text-gray-400 mb-8">Waiting for {bookedDoctor?.name} to confirm your appointment for <span className="text-white font-bold">{bookingSlot}</span>.</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-6">✅</div>
                    <h2 className="text-3xl font-black mb-3 text-green-500">Appointment Confirmed!</h2>
                    <p className="text-gray-400 mb-6">Your appointment is locked in for <span className="text-white font-bold">{bookingSlot}</span>.</p>
                    
                    {/* Show join links for online consultations, OR QR code for in-person */}
                    {consultationType === "google-meet" ? (
                      <div className="mb-8">
                        <a href={bookedDoctor?.meetLink || "#"} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-600 hover:bg-green-500 font-black rounded-2xl transition inline-block text-white shadow-lg shadow-green-900/30">
                          🎥 Join Google Meet
                        </a>
                      </div>
                    ) : consultationType === "platform-video" ? (
                      <div className="mb-8">
                        <button onClick={() => router.push(`/patient/consultation/${ticketId}`)} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 font-black rounded-2xl transition inline-block text-white shadow-lg shadow-blue-900/30">
                          🖥️ Join Platform Video
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-6 rounded-2xl inline-block mb-6 shadow-xl shadow-green-900/20">
                          <QRCodeSVG value={`TICKET:${ticketId}|PATIENT:${user.uid}`} size={200} />
                        </div>
                        <p className="text-sm text-gray-500 mb-2 uppercase tracking-wider font-bold">Show this QR Code at the counter</p>
                      </>
                    )}
                    <p className="text-xs text-gray-600 mb-8 mt-2">Ticket ID: {ticketId}</p>
                  </>
                )}

                <button
                  onClick={() => { setStep("dashboard"); setBookedStatus("none"); setSymptoms(""); setAnswers(""); setDoctors([]); }}
                  className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition w-full"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setStep("symptoms")} className="text-gray-500 hover:text-white text-sm font-bold mb-8 flex items-center gap-2 transition">
                  ← Back
                </button>

                {isMild && (
                  <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-2xl text-green-300 text-sm font-medium">
                    ✅ Good news — your symptoms are non-critical. You can book directly!
                  </div>
                )}

                <h2 className="text-4xl font-black mb-2">Available Doctors</h2>
                <p className="text-gray-400 mb-8">Select a doctor and pick an available time slot.</p>

                {loadingDoctors ? (
                  <div className="text-center py-16 text-gray-500">Finding available doctors...</div>
                ) : doctors.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    No doctors currently available in your zone. Please try again later.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {doctors.map(d => (
                      <div key={d.uid} className={`p-6 rounded-2xl border bg-white/5 ${d.isNearby ? 'border-red-500/30' : 'border-white/10'}`}>
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center font-black text-xl">
                              {(d.name || "D").charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-black text-lg text-white">{d.name}</h3>
                              <p className="text-gray-400 text-sm">{d.specialty}</p>
                              {d.location && <p className="text-gray-600 text-xs mt-0.5">📍 {d.location}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {d.isNearby && (
                              <span className="px-2 py-1 bg-red-900/30 text-red-400 border border-red-500/30 text-xs font-bold rounded-full">
                                📍 Nearby
                              </span>
                            )}
                            {d.role && (
                              <span className="px-2 py-1 bg-white/10 text-gray-300 text-xs font-bold rounded-full uppercase">
                                {d.role}
                              </span>
                            )}
                            {d.isOnline && (
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-500/30 text-xs font-bold rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Online
                              </span>
                            )}
                          </div>
                        </div>

                        {d.slots.length === 0 ? (
                          <p className="text-gray-600 text-sm">No available slots at the moment.</p>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Book a Slot</p>
                            <div className="space-y-4">
                              {d.slots.map((slot: any, i: number) => (
                                <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-xl border border-white/5 bg-black/50">
                                  <div className="flex-1 font-bold text-sm">
                                    {slot.time} <span className="text-gray-500 font-normal">({slot.duration_mins || 15}m)</span>
                                    {slot.room && <span className="ml-2 text-xs text-blue-400">[{slot.room}]</span>}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {/* Options for type of consultation based on doc profile */}
                                    {!d.isOnlineOnly && (
                                      <button
                                        onClick={() => handleBook(d, slot, "in-person")}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition text-xs"
                                      >
                                        In-Person
                                      </button>
                                    )}
                                    {d.isOnline && (
                                      <>
                                        <button
                                          onClick={() => handleBook(d, slot, "google-meet")}
                                          className="px-4 py-2 bg-green-900/40 hover:bg-green-800/60 text-green-400 font-bold rounded-lg transition text-xs"
                                        >
                                          Google Meet
                                        </button>
                                        <button
                                          onClick={() => handleBook(d, slot, "platform-video")}
                                          className="px-4 py-2 bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 font-bold rounded-lg transition text-xs"
                                        >
                                          Platform Video
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PREVIOUS RECORDS ── */}
        {step === "records" && (
          <div>
            <button onClick={() => setStep("dashboard")} className="text-gray-500 hover:text-white text-sm font-bold mb-8 flex items-center gap-2 transition">
              ← Back
            </button>
            <h2 className="text-4xl font-black mb-2">Medical Records</h2>
            <p className="text-gray-400 mb-8">Your past consultations and diagnoses.</p>

            {loadingRecords ? (
              <div className="text-center py-16 text-gray-500">Loading records...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-500">No medical records yet. Your history will appear here after consultations.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {records.map(r => (
                  <div key={r.id} className="p-6 rounded-2xl border border-white/10 bg-white/5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white">{r.final_diagnosis}</h3>
                        <p className="text-gray-500 text-sm">{r.location}</p>
                      </div>
                      {r.timestamp?.seconds && (
                        <span className="text-xs text-gray-600 font-medium">
                          {new Date(r.timestamp.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Prescribed Medicine</p>
                      <p className="text-sm text-gray-300">{r.medicine}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
