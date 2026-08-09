"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, updateDoc, doc } from "firebase/firestore";
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div
      className="pixel-inset"
      style={{ height: 300, backgroundColor: 'var(--map-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-retro)', fontSize: 20, letterSpacing: 2 }}
    >
      LOADING MAP...
    </div>
  ),
});

type Step = "dashboard" | "symptoms" | "followup" | "location" | "results" | "timetable" | "records";

/* ── Shared retro screen wrapper ── */
const RetroScreen = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <div style={{ fontFamily: 'var(--font-retro)' }}>
    {title && (
      <div
        className="pixel-inset mb-4"
        style={{ backgroundColor: 'var(--map-bg)', color: 'var(--btn-red)', padding: '10px 16px', fontSize: 26, letterSpacing: 4, textShadow: '2px 2px 0 var(--black)' }}
      >
        [ {title} ]
      </div>
    )}
    {children}
  </div>
);

/* ── Back button ── */
const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="retro-btn retro-btn-panel pixel-border mb-4" style={{ fontSize: 18 }}>
    ◀ BACK
  </button>
);

export default function PatientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("dashboard");

  const [symptoms, setSymptoms] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState("");

  const [triage, setTriage] = useState<any>(null);
  const [ticketId, setTicketId] = useState<string>("");
  const [isMild, setIsMild] = useState(false);
  const [expandedDoctors, setExpandedDoctors] = useState<Record<string, boolean>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string>("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isBooking, setIsBooking] = useState<string | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorToBook, setSelectedDoctorToBook] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<{time: string, booked: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string>("");
  const [bookedDoctor, setBookedDoctor] = useState<any>(null);
  const [bookedStatus, setBookedStatus] = useState<"none" | "pending_confirmation" | "confirmed">("none");
  const [consultationType, setConsultationType] = useState<"in-person" | "google-meet" | "platform-video" | null>(null);

  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [upcomingTickets, setUpcomingTickets] = useState<any[]>([]);

  useEffect(() => { if (!user) router.push('/login'); }, [user, router]);

  // Restore draft from cookie
  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )draftSession=([^;]+)'));
    if (match) {
      try {
        const draft = JSON.parse(decodeURIComponent(match[2]));
        if (draft.step) setStep(draft.step);
        if (draft.symptoms) setSymptoms(draft.symptoms);
        if (draft.locationName) setLocationName(draft.locationName);
        if (draft.triage) setTriage(draft.triage);
        if (draft.isMild !== undefined) setIsMild(draft.isMild);
      } catch(e) {}
    }
  }, []);

  const saveDraft = (data: any) => {
    const match = document.cookie.match(new RegExp('(^| )draftSession=([^;]+)'));
    let current = {};
    if (match) { try { current = JSON.parse(decodeURIComponent(match[2])); } catch(e){} }
    const updated = { ...current, ...data };
    document.cookie = `draftSession=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=86400`;
  };

  const clearDraft = () => {
    document.cookie = "draftSession=; path=/; max-age=0";
  };

  useEffect(() => {
    if (!ticketId || bookedStatus === "none") return;
    const unsub = onSnapshot(doc(db, "Tickets", ticketId), (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === "booked") {
        setBookedStatus("confirmed");
      }
    });
    return () => unsub();
  }, [ticketId, bookedStatus]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "Tickets"),
      where("patient_uid", "==", user.uid),
      where("status", "in", ["pending_confirmation", "pending_admin", "pending_booking", "booked"])
    );
    const unsub = onSnapshot(q, (snap) => {
      setUpcomingTickets(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [user?.uid]);

  const fetchDoctors = async (triageResult: any, loc: string) => {
    setLoadingDoctors(true);
    try {
      const allUsersSnap = await getDocs(query(collection(db, "Users"), where("role", "in", ["doctor", "hospital"])));
      const allDoctorUsers = allUsersSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));
      const profilesSnap = await getDocs(collection(db, "DoctorProfiles"));
      const found: any[] = [];

      profilesSnap.docs.forEach(p => {
        const pData = p.data() as any;
        const matchingUser = allDoctorUsers.find(u => u.uid === p.id);
        if (!matchingUser) return;
        const isNearby = matchingUser.location === loc || !loc;
        const isOnline = pData.isOnline || matchingUser.isOnline;
          if (matchingUser.role === "hospital") {
            const hospDoctors = pData.doctors || [];
            hospDoctors.forEach((hd: any) => {
              let isRecommended = false;
              if (triageResult) {
                const reqSpec = triageResult.required_specialty || "";
                if (triageResult.urgency_level > 2 && hd.specialty === reqSpec) isRecommended = true;
              }
              found.push({
                uid: p.id,
                subDocId: hd.id,
                name: `${hd.name} (${matchingUser.name})`,
                role: 'hospital_doctor',
                specialty: hd.specialty,
                location: matchingUser.location,
                ranges: hd.ranges || [],
                isOnline, meetLink: pData.meetLink, isNearby, isRecommended
              });
            });
          } else {
            let isRecommended = false;
            if (triageResult) {
              const reqSpec = triageResult.required_specialty || "";
              if (triageResult.urgency_level <= 2 && pData.specialty === "General Practitioner") isRecommended = true;
              else if (triageResult.urgency_level > 2 && pData.specialty === reqSpec) isRecommended = true;
            }
            found.push({
              uid: p.id, subDocId: null, name: matchingUser.name, role: matchingUser.role,
              specialty: pData.specialty, location: matchingUser.location,
              ranges: pData.ranges || [],
              isOnline, meetLink: pData.meetLink, isNearby, isRecommended
            });
          }
      });
      found.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        if (a.isNearby && !b.isNearby) return -1;
        if (!a.isNearby && b.isNearby) return 1;
        return 0;
      });
      setDoctors(found);
    } catch (e) { console.error(e); }
    finally { setLoadingDoctors(false); }
  };

  const handleInitialSubmit = async (skipFollowup = false) => {
    setIsSubmitting(true); setError("");
    const finalSymptoms = questions.length > 0 && !skipFollowup
      ? `Original: ${symptoms}\nFollow-up Answers: ${answers}` : symptoms;

    try {
      const res = await fetch("/api/triage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: finalSymptoms, location: locationName || "Sri Lanka", skip_followup: skipFollowup, patient_uid: user?.uid || "guest", patient_name: user?.name || "Patient" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Triage failed");

      if (data.needs_clarification) {
        setQuestions(data.questions || []);
        setStep("followup");
        saveDraft({ step: "followup", symptoms: finalSymptoms });
      } else {
        setTriage(data.triage); setIsMild(data.isMild);
        setStep("location");
        saveDraft({ step: "location", symptoms: finalSymptoms, triage: data.triage, isMild: data.isMild });
      }
    } catch (err: any) { setError(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleLocationSubmit = async () => {
    saveDraft({ locationName });
    await fetchDoctors(triage, locationName);
    setStep("results");
  };

  const handleViewTimetable = (docObj: any) => {
    setSelectedDoctorToBook(docObj);
    setSelectedDate("");
    setAvailableSlots([]);
    setStep("timetable");
  };

  const generateSlots = async (dateString: string) => {
    setSelectedDate(dateString);
    if (!selectedDoctorToBook || !dateString) return;
    setLoadingSlots(true);
    try {
      const dur = triage?.estimated_duration_mins || 15;
      const slots: {time: string, booked: boolean}[] = [];
      const ranges = selectedDoctorToBook.ranges || [];

      // Create format for time like "hh:mm a, MMM dd"
      const dateObj = new Date(dateString);
      const datePrefix = format(dateObj, "MMM dd");

      const now = new Date();
      for (const r of ranges) {
         let current = new Date(`${dateString}T${r.start}`);
         const end = new Date(`${dateString}T${r.end}`);
         while (current < end) {
            if (current > now) {
              const timeStr = format(current, "hh:mm a");
              slots.push({time: `${timeStr}, ${datePrefix}`, booked: false});
            }
            current.setMinutes(current.getMinutes() + dur);
         }
      }

      const ticketsQ = query(collection(db, "Tickets"), where("assigned_doc_uid", "==", selectedDoctorToBook.uid));
      const ticketsSnap = await getDocs(ticketsQ);
      
      const bookedTimes = new Set();
      ticketsSnap.docs.forEach(d => {
         const data = d.data();
         if (selectedDoctorToBook.subDocId && data.subDocId !== selectedDoctorToBook.subDocId) return;
         if (data.status !== "cancelled") {
            bookedTimes.add(data.appointment_time);
         }
      });

      slots.forEach(s => {
         if (bookedTimes.has(s.time)) s.booked = true;
      });

      setAvailableSlots(slots);
    } catch(e) {}
    setLoadingSlots(false);
  };

  const handleBook = async (docObj: any, slot: any, type: "in-person" | "google-meet" | "platform-video") => {
    if (!triage || isBooking) return;
    setIsBooking(slot.time);
    try {
      const res = await fetch("/api/book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_uid: user?.uid,
          patient_name: user?.name,
          symptoms: symptoms,
          triage: triage,
          location: locationName || "Sri Lanka",
          assigned_doc_uid: docObj.uid,
          subDocId: docObj.subDocId || null,
          appointment_time: slot.time,
          consultation_type: type,
          room: docObj.role === "hospital_doctor" ? docObj.name.split(" (")[0] : "Room 1"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      
      setTicketId(data.ticketId);
      setBookingSlot(slot.time); setBookedDoctor(docObj); setConsultationType(type);
      setBookedStatus("pending_confirmation");
      clearDraft();
    } catch (err: any) { alert(err.message || "Booking failed."); }
    finally { setIsBooking(null); }
  };

  const handleExplainToggle = async (docObj: any) => {
    const key = docObj.subDocId || docObj.uid;
    const isExpanded = expandedDoctors[key];
    if (isExpanded) {
       setExpandedDoctors(prev => ({...prev, [key]: false}));
       return;
    }
    
    setExpandedDoctors(prev => ({...prev, [key]: true}));
    
    if (!explanations[key]) {
      setLoadingExplanation(key);
      try {
        const res = await fetch("/api/explain-recommendation", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ triageSummary: triage, providerName: docObj.name, providerSpecialty: docObj.specialty })
        });
        const data = await res.json();
        setExplanations(prev => ({...prev, [key]: data.explanation}));
      } catch(e) {
      } finally {
        setLoadingExplanation("");
      }
    }
  };

  const fetchRecords = async () => {
    if (!user?.uid) return;
    setLoadingRecords(true); setStep("records");
    try {
      const q = query(collection(db, "MedicalLogs"), where("patient_uid", "==", user.uid));
      const snap = await getDocs(q);
      setRecords(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) { console.error(e); }
    finally { setLoadingRecords(false); }
  };

  if (!user) return null;

  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  return (
    <div className="min-h-screen p-4" style={s}>
      <div className="max-w-3xl mx-auto">

        {/* ── NAV HEADER ── */}
        <div
          className="flex items-center justify-between mb-6 pixel-inset"
          style={{ backgroundColor: 'var(--map-bg)', padding: '10px 16px' }}
        >
          <div style={{ color: 'var(--btn-red)', fontSize: 26, letterSpacing: 4, textShadow: '2px 2px 0 var(--black)' }}>
            🕷 MEDI<span style={{ color: 'var(--white)' }}>ROUTE</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, letterSpacing: 2 }}>
            {user.name?.toUpperCase()} · PATIENT
          </div>
        </div>

        {/* ── DASHBOARD HOME ── */}
        {step === "dashboard" && (
          <RetroScreen>
            {/* Welcome */}
            <div className="pixel-inset mb-5" style={{ backgroundColor: 'var(--map-bg)', padding: '14px 18px' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, letterSpacing: 3 }}>WELCOME BACK</div>
              <div style={{ color: 'var(--white)', fontSize: 40, letterSpacing: 4, textShadow: '3px 3px 0 var(--black)' }}>
                {user.name?.split(" ")[0].toUpperCase()}<span style={{ color: 'var(--btn-red)' }}>.</span>
              </div>
            </div>

            {/* Upcoming Tickets */}
            {upcomingTickets.length > 0 && (
              <div className="mb-5 flex flex-col gap-3">
                {upcomingTickets.map(ticket => (
                  <div key={ticket.id} className="pixel-inset flex flex-col gap-2" style={{ backgroundColor: ticket.status === 'booked' ? 'rgba(54,226,106,0.2)' : 'rgba(240,224,96,0.2)', padding: '14px 18px' }}>
                    <div style={{ color: ticket.status === 'booked' ? 'var(--btn-green)' : 'var(--btn-yellow)', fontSize: 18, letterSpacing: 2 }}>
                      {ticket.status === 'booked' ? '✅ APPOINTMENT CONFIRMED' : '⏳ PENDING'}
                    </div>
                    <div style={{ color: 'var(--white)', fontSize: 20 }}>
                      Time: {ticket.appointment_time}
                    </div>
                    {ticket.room && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>{ticket.room}</div>}
                    <button onClick={() => {
                          setTicketId(ticket.id);
                          setBookedStatus(ticket.status === 'booked' ? 'confirmed' : 'pending_confirmation');
                          setConsultationType(ticket.consultation_type);
                          setBookingSlot(ticket.appointment_time);
                          setStep("results");
                    }} className="retro-btn retro-btn-panel pixel-border w-fit mt-2" style={{ fontSize: 14 }}>VIEW TICKET / QR CODE</button>
                  </div>
                ))}
              </div>
            )}

            {/* Action cards */}
            <div className="flex flex-col gap-4">
              <button
                id="find-doctor-btn"
                onClick={() => setStep("symptoms")}
                className="retro-btn retro-btn-red pixel-border retro-btn-full flex items-center gap-4"
                style={{ padding: '14px 18px' }}
              >
                <span style={{ fontSize: 32 }}>🔍</span>
                <div className="flex flex-col items-start">
                  <span style={{ fontSize: 26 }}>FIND A DOCTOR</span>
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', textTransform: 'none', letterSpacing: 1, fontFamily: 'var(--font-retro)' }}>Describe symptoms → AI triage → Book</span>
                </div>
                <span className="ml-auto" style={{ fontSize: 24 }}>▶</span>
              </button>

              <button
                id="records-btn"
                onClick={fetchRecords}
                className="retro-btn retro-btn-cyan pixel-border retro-btn-full flex items-center gap-4"
                style={{ padding: '14px 18px' }}
              >
                <span style={{ fontSize: 32 }}>📋</span>
                <div className="flex flex-col items-start">
                  <span style={{ fontSize: 26 }}>MY RECORDS</span>
                  <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.6)', textTransform: 'none', letterSpacing: 1, fontFamily: 'var(--font-retro)' }}>View past consultations & prescriptions</span>
                </div>
                <span className="ml-auto" style={{ fontSize: 24 }}>▶</span>
              </button>
            </div>
          </RetroScreen>
        )}

        {/* ── SYMPTOM FORM ── */}
        {step === "symptoms" && (
          <RetroScreen title="AI TRIAGE">
            <BackBtn onClick={() => setStep("dashboard")} />
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginBottom: 16, letterSpacing: 2 }}>
              DESCRIBE YOUR SYMPTOMS AND LET THE AI ANALYZE.
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="retro-label block mb-1">SYMPTOMS</label>
                <textarea
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  rows={5}
                  className="retro-textarea"
                  placeholder="E.g. Feeling dizzy after a spider bite..."
                />
              </div>

              {error && (
                <div className="pixel-border" style={{ backgroundColor: 'var(--btn-red)', color: 'var(--black)', padding: '8px 12px', fontSize: 18 }}>
                  !! {error}
                </div>
              )}

                <button
                  id="submit-symptoms-btn"
                  disabled={!symptoms || isSubmitting}
                  onClick={() => handleInitialSubmit(false)}
                  className="retro-btn retro-btn-red pixel-border retro-btn-full"
                  style={{ opacity: (!symptoms || isSubmitting) ? 0.5 : 1 }}
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div className="spider-web-loader" style={{ width: '30px', height: '30px' }}>
                        <div className="spider-web-core" style={{ width: '10px', height: '10px' }}></div>
                      </div>
                      ANALYZING WEB...
                    </div>
                  ) : '▶ RUN AI TRIAGE'}
                </button>
            </div>
          </RetroScreen>
        )}

        {/* ── FOLLOW-UP QUESTIONS ── */}
        {step === "followup" && (
          <RetroScreen title="MORE INFO NEEDED">
            <div className="pixel-inset mb-4" style={{ backgroundColor: 'var(--map-bg)', padding: '14px 18px' }}>
              <div style={{ color: 'var(--btn-cyan)', fontSize: 18, letterSpacing: 2, marginBottom: 10 }}>AI ASKS:</div>
              <ul className="flex flex-col gap-2">
                {questions.map((q, i) => (
                  <li key={i} style={{ color: 'var(--white)', fontSize: 20, letterSpacing: 1 }}>
                    <span style={{ color: 'var(--btn-red)' }}>{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>

            <textarea
              value={answers}
              onChange={e => setAnswers(e.target.value)}
              rows={4}
              className="retro-textarea mb-3"
              placeholder="TYPE YOUR ANSWERS HERE..."
            />

            <div className="flex gap-3">
              <button
                id="submit-answers-btn"
                disabled={!answers || isSubmitting}
                onClick={() => handleInitialSubmit(false)}
                className="retro-btn retro-btn-blue pixel-border flex-1"
                style={{ fontSize: 20, opacity: (!answers || isSubmitting) ? 0.5 : 1 }}
              >
                {isSubmitting ? 'ANALYZING...' : 'SUBMIT'}
              </button>
              <button
                id="skip-btn"
                disabled={isSubmitting}
                onClick={() => handleInitialSubmit(true)}
                className="retro-btn retro-btn-panel pixel-border"
                style={{ fontSize: 20 }}
              >
                SKIP
              </button>
            </div>
          </RetroScreen>
        )}

        {/* ── LOCATION MAP ── */}
        {step === "location" && (
          <RetroScreen title="YOUR LOCATION">
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginBottom: 16, letterSpacing: 2 }}>
              DROP A PIN OR SELECT YOUR ZONE.
            </div>

            <div className="mb-4">
              <MapWithNoSSR onLocationSelected={(lat, lng) => setLatLng({lat, lng})} />
            </div>

            <div className="mb-4">
              <label className="retro-label block mb-1">COLOMBO ZONE</label>
              <select
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                className="retro-select"
              >
                <option value="" disabled>SELECT ZONE</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                  <option key={n} value={`Colombo ${n}`}>COLOMBO {n}</option>
                ))}
              </select>
            </div>

            <button
              id="find-doctors-btn"
              onClick={handleLocationSubmit}
              className="retro-btn retro-btn-red pixel-border retro-btn-full"
            >
              ▶ FIND DOCTORS
            </button>
          </RetroScreen>
        )}

        {/* ── DOCTOR RESULTS ── */}
        {step === "results" && (
          <RetroScreen title="AVAILABLE UNITS">
            {bookedStatus !== "none" ? (
              /* Booking confirmation */
              <div className="flex flex-col items-center gap-4">
                <div
                  className="pixel-inset w-full"
                  style={{
                    backgroundColor: bookedStatus === "confirmed" ? 'var(--btn-green)' : 'var(--map-bg)',
                    color: bookedStatus === "confirmed" ? 'var(--black)' : 'var(--btn-yellow)',
                    padding: '20px', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 50, marginBottom: 8 }}>
                    {bookedStatus === "pending_confirmation" ? '⏳' : '✅'}
                  </div>
                  <div style={{ fontSize: 28, letterSpacing: 3, fontFamily: 'var(--font-retro)' }}>
                    {bookedStatus === "pending_confirmation" ? 'PENDING CONFIRMATION' : 'APPOINTMENT CONFIRMED!'}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 8, opacity: 0.8 }}>
                    {bookedStatus === "pending_confirmation"
                      ? `Waiting for ${bookedDoctor?.name} to confirm: ${bookingSlot}`
                      : `Locked in for ${bookingSlot}`}
                  </div>
                </div>

                {/* QR CODE - ALWAYS SHOW ONCE BOOKED/PENDING */}
                {(consultationType === "in-person" || !consultationType) && (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div style={{ backgroundColor: 'var(--white)', padding: 16, display: 'inline-block' }}>
                      <QRCodeSVG value={`TICKET:${ticketId}|PATIENT:${user.uid}`} size={160} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, letterSpacing: 2 }}>
                      {bookedStatus === "pending_confirmation" ? "RETAIN THIS QR CODE" : "SHOW THIS QR CODE AT THE COUNTER"}
                    </div>
                  </div>
                )}

                {bookedStatus === "confirmed" && (
                  <>
                    {consultationType === "google-meet" ? (
                      <a href={bookedDoctor?.meetLink || "#"} target="_blank" rel="noopener noreferrer"
                         className="retro-btn retro-btn-green pixel-border retro-btn-full mt-4" style={{ fontSize: 22, display: 'block', textAlign: 'center' }}>
                        🎥 JOIN GOOGLE MEET
                      </a>
                    ) : consultationType === "platform-video" ? (
                      <button onClick={() => router.push(`/patient/consultation/${ticketId}`)}
                              className="retro-btn retro-btn-blue pixel-border retro-btn-full mt-4" style={{ fontSize: 22 }}>
                        🖥️ JOIN PLATFORM VIDEO
                      </button>
                    ) : null}
                  </>
                )}

                <button
                  id="back-to-dashboard-btn"
                  onClick={() => { setStep("dashboard"); setBookedStatus("none"); setSymptoms(""); setAnswers(""); setDoctors([]); }}
                  className="retro-btn retro-btn-panel pixel-border retro-btn-full"
                  style={{ fontSize: 20 }}
                >
                  ◀ BACK TO DASHBOARD
                </button>
              </div>
            ) : (
              <>
                <BackBtn onClick={() => setStep("symptoms")} />

                {isMild && (
                  <div className="pixel-border mb-4" style={{ backgroundColor: 'var(--btn-green)', color: 'var(--black)', padding: '10px 14px', fontSize: 18 }}>
                    ✅ NON-CRITICAL — BOOK DIRECTLY!
                  </div>
                )}

                {loadingDoctors ? (
                  <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="spider-web-loader">
                      <div className="spider-web-core"></div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, letterSpacing: 2 }}>
                      SCANNING NETWORK...
                    </div>
                  </div>
                ) : doctors.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, textAlign: 'center', padding: '40px 0' }}>
                    NO UNITS AVAILABLE IN YOUR ZONE.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {doctors.map(d => (
                      <div
                        key={d.uid}
                        className="pixel-inset"
                        style={{ backgroundColor: 'var(--map-bg)', padding: 16 }}
                      >
                        {/* Doctor header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div style={{ width: 44, height: 44, backgroundColor: 'var(--btn-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'var(--font-retro)', color: 'var(--white)' }}>
                            {(d.name || "D").charAt(0)}
                          </div>
                          <div>
                            <div style={{ color: 'var(--white)', fontSize: 24, letterSpacing: 2 }}>{d.name}</div>
                            <div style={{ color: 'var(--btn-cyan)', fontSize: 18, letterSpacing: 1 }}>{d.specialty}</div>
                            {d.location && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>📍 {d.location}</div>}
                          </div>
                          <div className="ml-auto flex flex-col gap-1 items-end">
                            {d.isRecommended && (
                              <div className="flex items-center gap-2">
                                <span className="retro-badge pixel-pulse" style={{ backgroundColor: 'var(--btn-yellow)', color: 'var(--black)', fontSize: 13, border: '2px solid var(--black)' }}>
                                  ⭐ RECOMMENDED
                                </span>
                                <button onClick={() => handleExplainToggle(d)} className="retro-btn" style={{ padding: '2px 8px', fontSize: 12, backgroundColor: 'var(--map-bg)', color: 'var(--btn-yellow)', border: '1px solid var(--btn-yellow)' }}>
                                  {expandedDoctors[d.subDocId || d.uid] ? "HIDE" : "SHOW"}
                                </button>
                              </div>
                            )}
                            {d.isNearby && (
                              <span className="retro-badge" style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', fontSize: 13 }}>📍 NEARBY</span>
                            )}
                            {d.isOnline && (
                              <span className="retro-badge" style={{ backgroundColor: 'var(--btn-green)', color: 'var(--black)', fontSize: 13 }}>● ONLINE</span>
                            )}
                          </div>
                        </div>

                        {d.isRecommended && expandedDoctors[d.subDocId || d.uid] && (
                           <div className="mb-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {loadingExplanation === (d.subDocId || d.uid) ? (
                                <div style={{ color: 'var(--btn-yellow)', fontSize: 14 }}>Generating explanation...</div>
                              ) : explanations[d.subDocId || d.uid] ? (
                                <div className="pixel-inset" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--white)', padding: '10px', fontSize: 16, maxWidth: '80%', fontStyle: 'italic', borderLeft: '4px solid var(--btn-yellow)' }}>
                                  "{explanations[d.subDocId || d.uid]}"
                                </div>
                              ) : null}
                           </div>
                        )}

                        {d.ranges && d.ranges.length > 0 && (
                           <div className="mb-4">
                             <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 1, marginBottom: 4 }}>SCHEDULE:</div>
                             <div className="flex flex-wrap gap-2">
                               {d.ranges.map((r: any, idx: number) => (
                                 <span key={idx} className="pixel-inset" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--btn-cyan)', padding: '4px 8px', fontSize: 14 }}>
                                   {r.start} - {r.end}
                                 </span>
                               ))}
                             </div>
                           </div>
                        )}

                        {/* Slots Action */}
                        <div className="flex flex-col gap-2 mt-4" style={{ borderTop: '2px solid rgba(40,68,105,0.8)', paddingTop: 16 }}>
                          <button onClick={() => handleViewTimetable(d)} className="retro-btn retro-btn-cyan pixel-border" style={{ fontSize: 18 }}>
                            ▶ VIEW TIMETABLE & BOOK
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </RetroScreen>
        )}

        {/* ── TIMETABLE STEP ── */}
        {step === "timetable" && selectedDoctorToBook && (
          <RetroScreen title="BOOKING TIMETABLE">
            <BackBtn onClick={() => setStep("results")} />
            
            <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 24 }}>
              <div className="flex justify-between items-center mb-6" style={{ borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: 16 }}>
                <div>
                  <div style={{ color: 'var(--white)', fontSize: 26, letterSpacing: 2 }}>{selectedDoctorToBook.name}</div>
                  <div style={{ color: 'var(--btn-cyan)', fontSize: 18, letterSpacing: 1 }}>{selectedDoctorToBook.specialty}</div>
                </div>
                {selectedDoctorToBook.isOnline && (
                  <span className="retro-badge" style={{ backgroundColor: 'var(--btn-green)', color: 'var(--black)', fontSize: 13 }}>● ONLINE</span>
                )}
              </div>

              <div className="mb-6">
                <label className="retro-label block mb-2">SELECT DATE</label>
                <input 
                  type="date" 
                  className="retro-input" 
                  value={selectedDate} 
                  onChange={(e) => generateSlots(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {selectedDate && (
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 2, marginBottom: 16 }}>
                    AVAILABLE SLOTS FOR {new Date(selectedDate).toLocaleDateString()}
                  </div>

                  {loadingSlots ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--btn-cyan)' }}>
                      <div className="spider-web-loader" style={{ width: 24, height: 24 }}>
                        <div className="spider-web-core" style={{ width: 8, height: 8 }}></div>
                      </div>
                      LOADING SLOTS...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 17 }}>NO SLOTS AVAILABLE ON THIS DATE</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {availableSlots.map((slot: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center" style={{ backgroundColor: slot.booked ? 'rgba(226,54,54,0.1)' : 'rgba(0,0,0,0.3)', padding: 12 }}>
                          <div style={{ color: slot.booked ? 'rgba(255,255,255,0.4)' : 'var(--white)', fontSize: 20, flex: 1, textDecoration: slot.booked ? 'line-through' : 'none' }}>
                            {slot.time.split(",")[0]} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>({triage?.estimated_duration_mins || 15}m)</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {slot.booked ? (
                              <span style={{ color: 'var(--btn-red)', fontSize: 16, letterSpacing: 2, padding: '4px 12px' }}>BOOKED</span>
                            ) : (
                              <>
                                {!selectedDoctorToBook.isOnlineOnly && (
                                  <button onClick={() => handleBook(selectedDoctorToBook, slot, "in-person")}
                                          disabled={!!isBooking}
                                          className="retro-btn retro-btn-panel pixel-border" style={{ fontSize: 15, opacity: isBooking ? 0.5 : 1 }}>
                                    {isBooking === slot.time ? '...' : 'IN-PERSON'}
                                  </button>
                                )}
                                {selectedDoctorToBook.isOnline && (
                                  <>
                                    <button onClick={() => handleBook(selectedDoctorToBook, slot, "google-meet")}
                                            disabled={!!isBooking}
                                            className="retro-btn retro-btn-green pixel-border" style={{ fontSize: 15, opacity: isBooking ? 0.5 : 1 }}>
                                      {isBooking === slot.time ? '...' : 'G-MEET'}
                                    </button>
                                    <button onClick={() => handleBook(selectedDoctorToBook, slot, "platform-video")}
                                            disabled={!!isBooking}
                                            className="retro-btn retro-btn-blue pixel-border" style={{ fontSize: 15, color: 'var(--white)', opacity: isBooking ? 0.5 : 1 }}>
                                      {isBooking === slot.time ? '...' : 'VIDEO'}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </RetroScreen>
        )}

        {/* ── PREVIOUS RECORDS ── */}
        {step === "records" && (
          <RetroScreen title="MEDICAL RECORDS">
            <BackBtn onClick={() => setStep("dashboard")} />

            {loadingRecords ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, textAlign: 'center', padding: '40px 0', letterSpacing: 2 }}>
                LOADING RECORDS...
              </div>
            ) : records.length === 0 ? (
              <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>📭</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, letterSpacing: 2 }}>NO RECORDS YET.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {records.map(r => (
                  <div key={r.id} className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 16 }}>
                    <div className="flex justify-between items-start mb-3">
                      <div style={{ color: 'var(--white)', fontSize: 22, letterSpacing: 2 }}>{r.final_diagnosis}</div>
                      {r.timestamp?.seconds && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                          {new Date(r.timestamp.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 8 }}>📍 {r.location}</div>
                    <div style={{ borderTop: '2px solid rgba(40,68,105,0.8)', paddingTop: 10 }}>
                      <div style={{ color: 'var(--btn-cyan)', fontSize: 15, letterSpacing: 2, marginBottom: 4 }}>PRESCRIBED MEDICINE</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>{r.medicine}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </RetroScreen>
        )}
      </div>
    </div>
  );
}
