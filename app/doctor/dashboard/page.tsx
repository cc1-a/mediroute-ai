"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

type Tab = "queue" | "schedule";

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("queue");
  const [tickets, setTickets] = useState<any[]>([]);
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);

  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicine, setMedicine] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  
  // Hospital - Add Doctor State
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("General Practitioner");
  
  // Time Ranges State
  const [newRangeStart, setNewRangeStart] = useState("");
  const [newRangeEnd, setNewRangeEnd] = useState("");
  const [newRangeType, setNewRangeType] = useState<"both" | "online" | "in-person">("both");
  const [newRangeAddress, setNewRangeAddress] = useState("");
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "Tickets"), where("assigned_doc_uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, snap => {
      const allData = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const bookedData = allData.filter(t => t.status === "booked");
      bookedData.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(bookedData);

      const pendingData = allData.filter(t => t.status === "pending_confirmation");
      pendingData.sort((a, b) => b.urgency_level - a.urgency_level);
      setPendingTickets(pendingData);
    });

    const fetchProfile = async () => {
      const docRef = doc(db, "DoctorProfiles", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProfile(docSnap.data());
    };
    fetchProfile();

    return () => unsubscribe();
  }, [user]);

  const handleConfirmAppointment = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, "Tickets", ticketId), { status: "booked" });
    } catch { alert("Failed to confirm appointment"); }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleting(true);
    try {
      await updateDoc(doc(db, "Tickets", activeConsultation.id), { status: "completed" });
      await addDoc(collection(db, "MedicalLogs"), {
        ticket_id: activeConsultation.id, patient_uid: activeConsultation.patient_uid,
        patient_name: activeConsultation.patient_name, final_diagnosis: diagnosis,
        medicine, location: activeConsultation.location, timestamp: serverTimestamp(),
      });
      setActiveConsultation(null); setDiagnosis(""); setMedicine("");
      alert("Consultation saved to patient's medical records.");
    } catch { alert("Failed to complete consultation."); }
    finally { setIsCompleting(false); }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !user?.uid) return;
    setIsSavingSlot(true);
    try {
      const newDoctor = {
        id: Date.now().toString(),
        name: newDocName,
        specialty: newDocSpecialty,
        ranges: []
      };
      const updatedDoctors = [...(profile?.doctors || []), newDoctor];
      await setDoc(doc(db, "DoctorProfiles", user.uid), { ...profile, doctors: updatedDoctors }, { merge: true });
      setProfile({ ...profile, doctors: updatedDoctors });
      setNewDocName("");
    } catch { alert("Failed to add doctor."); }
    finally { setIsSavingSlot(false); }
  };

  const handleAddRange = async (e: React.FormEvent, doctorId: string | null) => {
    e.preventDefault();
    if (!newRangeStart || !newRangeEnd || !profile || !user?.uid) return;
    setIsSavingSlot(true);
    try {
      const sNew = newRangeStart;
      const eNew = newRangeEnd;
      if (sNew >= eNew) {
        alert("Invalid range: start time must be before end time.");
        setIsSavingSlot(false);
        return;
      }

      let existingRanges: any[] = [];
      if (user.role === 'hospital' && doctorId) {
        const d = profile.doctors?.find((doc: any) => doc.id === doctorId);
        if (d) existingRanges = d.ranges || [];
      } else {
        existingRanges = profile.ranges || [];
      }

      const hasOverlap = existingRanges.some((r: any) => {
        return r.start < eNew && sNew < r.end;
      });

      if (hasOverlap) {
        alert("Invalid range: overlaps with an existing time range.");
        setIsSavingSlot(false);
        return;
      }

      const newRange = { 
        start: sNew, 
        end: eNew,
        type: newRangeType,
        address: newRangeType !== "online" ? newRangeAddress || "123 Fake Medical St, Metropolis" : ""
      };
      let updatedProfile = { ...profile };

      if (user.role === 'hospital' && doctorId) {
        const doctors = [...(profile.doctors || [])];
        const docIdx = doctors.findIndex((d: any) => d.id === doctorId);
        if (docIdx >= 0) {
          doctors[docIdx].ranges = [...(doctors[docIdx].ranges || []), newRange];
          updatedProfile.doctors = doctors;
        }
      } else {
        updatedProfile.ranges = [...(profile.ranges || []), newRange];
      }

      await setDoc(doc(db, "DoctorProfiles", user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
      setNewRangeStart(""); setNewRangeEnd(""); setNewRangeType("both"); setNewRangeAddress("");
    } catch { alert("Failed to add time range."); }
    finally { setIsSavingSlot(false); }
  };

  const removeRange = async (rangeIdx: number, doctorId: string | null) => {
    if (!profile || !user?.uid) return;
    try {
      let updatedProfile = { ...profile };
      if (user.role === 'hospital' && doctorId) {
        const doctors = [...(profile.doctors || [])];
        const docIdx = doctors.findIndex((d: any) => d.id === doctorId);
        if (docIdx >= 0) {
          doctors[docIdx].ranges = doctors[docIdx].ranges.filter((_: any, i: number) => i !== rangeIdx);
          updatedProfile.doctors = doctors;
        }
      } else {
        updatedProfile.ranges = (profile.ranges || []).filter((_: any, i: number) => i !== rangeIdx);
      }
      await setDoc(doc(db, "DoctorProfiles", user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
    } catch { alert("Failed to remove range"); }
  };

  const dashboardTitle = user?.role === 'hospital' ? 'HOSPITAL DASHBOARD' : 'DOCTOR DASHBOARD';
  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  return (
    <div className="min-h-screen flex flex-col" style={s}>

      {/* ── TOP NAV ── */}
      <div
        className="flex items-center justify-between sticky top-0 z-10"
        style={{
          backgroundColor: 'var(--bg-panel)',
          padding: '12px 20px',
          boxShadow: '0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black)',
        }}
      >
        <div>
          <div style={{ color: 'var(--btn-red)', fontSize: 26, letterSpacing: 4, textShadow: '2px 2px 0 var(--black)' }}>
            🕷 {dashboardTitle}
          </div>
          <div style={{ color: 'var(--black)', fontSize: 16, letterSpacing: 2 }}>{user?.name?.toUpperCase()}</div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-3">
          <button
            id="tab-queue"
            onClick={() => setTab("queue")}
            className="retro-btn pixel-border"
            style={{ fontSize: 18, backgroundColor: tab === "queue" ? 'var(--btn-red)' : 'var(--map-bg)', color: tab === "queue" ? 'var(--white)' : 'rgba(255,255,255,0.6)' }}
          >
            QUEUE
          </button>
          <button
            id="tab-schedule"
            onClick={() => setTab("schedule")}
            className="retro-btn pixel-border"
            style={{ fontSize: 18, backgroundColor: tab === "schedule" ? 'var(--btn-orange)' : 'var(--map-bg)', color: tab === "schedule" ? 'var(--black)' : 'rgba(255,255,255,0.6)' }}
          >
            SCHEDULE
          </button>
        </div>
      </div>

      {/* ── CONSULTATION QUEUE ── */}
      {tab === "queue" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <div
            className="flex flex-col"
            style={{ width: 320, borderRight: '4px solid var(--black)', backgroundColor: 'var(--map-bg)', overflow: 'hidden' }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

              {/* Pending Section */}
              <div className="mb-6">
                <div className="pixel-inset mb-3" style={{ backgroundColor: 'rgba(240,224,96,0.2)', padding: '6px 12px' }}>
                  <span style={{ color: 'var(--btn-yellow)', fontSize: 17, letterSpacing: 2 }}>
                    PENDING ({pendingTickets.length})
                  </span>
                </div>

                {pendingTickets.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, textAlign: 'center', padding: '16px 0', letterSpacing: 1 }}>
                    NO PENDING REQUESTS.
                  </div>
                )}

                {pendingTickets.map(ticket => (
                  <div key={ticket.id} className="pixel-inset mb-3" style={{ backgroundColor: 'rgba(240,224,96,0.1)', padding: 12 }}>
                    <div className="flex justify-between items-start mb-2">
                      <span style={{ color: 'var(--white)', fontSize: 18, letterSpacing: 1 }}>{ticket.patient_name}</span>
                      <span style={{ color: 'var(--btn-yellow)', fontSize: 14, letterSpacing: 1 }}>{ticket.appointment_time}</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 8 }}>
                      {ticket.consultation_type === 'in-person' ? '🏥 In-Person' : '💻 Online'} · {ticket.room}
                    </div>
                    <button
                      id={`confirm-${ticket.id}`}
                      onClick={() => handleConfirmAppointment(ticket.id)}
                      className="retro-btn retro-btn-yellow pixel-border retro-btn-full"
                      style={{ fontSize: 16 }}
                    >
                      ✓ CONFIRM
                    </button>
                  </div>
                ))}
              </div>

              {/* Confirmed Section */}
              <div>
                <div className="pixel-inset mb-3" style={{ backgroundColor: 'rgba(155,229,155,0.2)', padding: '6px 12px' }}>
                  <span style={{ color: 'var(--btn-green)', fontSize: 17, letterSpacing: 2 }}>
                    CONFIRMED ({tickets.length})
                  </span>
                </div>

                {tickets.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, textAlign: 'center', padding: '16px 0', letterSpacing: 1 }}>
                    NO APPOINTMENTS TODAY.
                  </div>
                )}

                {tickets.map(ticket => (
                  <button
                    key={ticket.id}
                    id={`ticket-${ticket.id}`}
                    onClick={() => { setActiveConsultation(ticket); setDiagnosis(""); setMedicine(""); }}
                    className="pixel-inset mb-2 w-full text-left"
                    style={{
                      backgroundColor: activeConsultation?.id === ticket.id ? 'rgba(226,54,54,0.3)' : 'rgba(0,0,0,0.3)',
                      padding: 12, border: 'none', cursor: 'pointer',
                      outline: activeConsultation?.id === ticket.id ? '2px solid var(--btn-red)' : 'none',
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span style={{ color: 'var(--white)', fontSize: 18, letterSpacing: 1, fontFamily: 'var(--font-retro)' }}>{ticket.patient_name}</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-retro)',
                          fontSize: 14, padding: '2px 6px',
                          backgroundColor: ticket.urgency_level >= 4 ? 'var(--btn-red)' : 'rgba(255,255,255,0.1)',
                          color: ticket.urgency_level >= 4 ? 'var(--white)' : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        LVL {ticket.urgency_level}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 1 }}>
                      {ticket.consultation_type === 'in-person' ? '🏥' : '💻'} {ticket.room}
                    </div>
                    <div style={{ color: 'var(--btn-green)', fontSize: 14, fontFamily: 'var(--font-retro)', letterSpacing: 1, marginTop: 4 }}>
                      {ticket.appointment_time}
                    </div>
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Main Panel */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: 'var(--bg-dark)' }}>
            {!activeConsultation ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 60, marginBottom: 16, opacity: 0.3 }}>🩺</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 26, letterSpacing: 3 }}>SELECT AN APPOINTMENT</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, marginTop: 8, letterSpacing: 2 }}>CLICK FROM THE SIDEBAR QUEUE TO BEGIN</div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">

                {/* Patient header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div style={{ color: 'var(--white)', fontSize: 36, letterSpacing: 3, textShadow: '2px 2px 0 var(--black)', fontFamily: 'var(--font-retro)' }}>
                        {activeConsultation.patient_name.toUpperCase()}
                      </div>
                      {activeConsultation.emergency_flag && (
                        <span className="retro-badge blink" style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', fontSize: 14 }}>
                          🚨 EMERGENCY
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 2, fontFamily: 'var(--font-retro)' }}>
                      URGENCY: LVL {activeConsultation.urgency_level} · {activeConsultation.appointment_time} · {activeConsultation.room}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, letterSpacing: 2, fontFamily: 'var(--font-retro)', marginBottom: 4 }}>TICKET ID</div>
                    <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: '4px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'monospace', letterSpacing: 1 }}>
                      {activeConsultation.id}
                    </div>

                    {activeConsultation.consultation_type === "platform-video" && (
                      <button onClick={() => router.push(`/patient/consultation/${activeConsultation.id}`)}
                              className="retro-btn retro-btn-blue pixel-border mt-2" style={{ fontSize: 15, color: 'var(--white)' }}>
                        🖥️ JOIN VIDEO
                      </button>
                    )}
                    {activeConsultation.consultation_type === "google-meet" && (
                      <a href={profile?.meetLink || "#"} target="_blank" rel="noopener noreferrer"
                         className="retro-btn retro-btn-green pixel-border mt-2 inline-block" style={{ fontSize: 15 }}>
                        🎥 JOIN MEET
                      </a>
                    )}
                  </div>
                </div>

                {/* AI Triage Summary */}
                <div className="pixel-inset mb-6" style={{ backgroundColor: 'var(--map-bg)', padding: '16px', borderLeft: '6px solid var(--btn-red)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 3, marginBottom: 8, fontFamily: 'var(--font-retro)' }}>AI TRIAGE SUMMARY</div>
                  <div style={{ color: 'var(--white)', fontSize: 20, lineHeight: 1.5, fontFamily: 'var(--font-retro)', letterSpacing: 1 }}>
                    {activeConsultation.core_symptoms}
                  </div>
                  {activeConsultation.raw_symptoms !== activeConsultation.core_symptoms && (
                    <div className="pixel-inset mt-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '10px 12px' }}>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: 2, marginBottom: 4, fontFamily: 'var(--font-retro)' }}>PATIENT&apos;S EXACT WORDS</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, fontStyle: 'italic', fontFamily: 'var(--font-retro)' }}>
                        &quot;{activeConsultation.raw_symptoms}&quot;
                      </div>
                    </div>
                  )}
                </div>

                {/* Post-Consultation Form */}
                <form onSubmit={handleComplete} className="flex flex-col gap-4">
                  <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 16 }}>
                    <div style={{ color: 'var(--btn-orange)', fontSize: 20, letterSpacing: 3, marginBottom: 12, fontFamily: 'var(--font-retro)' }}>
                      [ POST-CONSULTATION LOG ]
                    </div>

                    <div className="mb-4">
                      <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>FINAL DIAGNOSIS</label>
                      <textarea
                        required value={diagnosis}
                        onChange={e => setDiagnosis(e.target.value)}
                        rows={3}
                        className="retro-textarea"
                        placeholder="ENTER THE OFFICIAL DIAGNOSIS..."
                      />
                    </div>

                    <div>
                      <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>PRESCRIBED MEDICINE / ACTIONS</label>
                      <textarea
                        required value={medicine}
                        onChange={e => setMedicine(e.target.value)}
                        rows={3}
                        className="retro-textarea"
                        placeholder="E.G. PARACETAMOL 500MG, REST 2 DAYS..."
                      />
                    </div>
                  </div>

                  <button
                    id="complete-consultation-btn"
                    type="submit"
                    disabled={isCompleting}
                    className="retro-btn retro-btn-red pixel-border retro-btn-full"
                    style={{ color: 'var(--white)', fontSize: 22, opacity: isCompleting ? 0.6 : 1 }}
                  >
                    {isCompleting ? 'SAVING TO RECORDS...' : '▶ MARK COMPLETE & SAVE LOG'}
                  </button>
                </form>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ── SCHEDULE TAB ── */}
      {tab === "schedule" && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: 'var(--bg-dark)' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="md:col-span-3 flex flex-col gap-6">
              
              {user?.role === 'hospital' && (
                <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 20 }}>
                  <div style={{ color: 'var(--btn-orange)', fontSize: 22, letterSpacing: 3, marginBottom: 16 }}>
                    [ ADD DOCTOR ]
                  </div>
                  <form onSubmit={handleAddDoctor} className="flex gap-4 flex-wrap items-end">
                    <div className="flex-1" style={{ minWidth: 200 }}>
                      <label className="retro-label block mb-1">DOCTOR NAME</label>
                      <input type="text" required value={newDocName} onChange={e => setNewDocName(e.target.value)} className="retro-input" placeholder="DR. JOHN DOE" />
                    </div>
                    <div className="flex-1" style={{ minWidth: 200 }}>
                      <label className="retro-label block mb-1">SPECIALTY</label>
                      <select value={newDocSpecialty} onChange={e => setNewDocSpecialty(e.target.value)} className="retro-select">
                        <option value="General Practitioner">General Practitioner</option>
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="Neurologist">Neurologist</option>
                        <option value="Pediatrician">Pediatrician</option>
                        <option value="Orthopedic">Orthopedic</option>
                      </select>
                    </div>
                    <button type="submit" disabled={isSavingSlot} className="retro-btn retro-btn-cyan pixel-border" style={{ fontSize: 20 }}>
                      ▶ ADD
                    </button>
                  </form>
                </div>
              )}

              <div style={{ color: 'var(--white)', fontSize: 24, letterSpacing: 3, marginBottom: 8, fontFamily: 'var(--font-retro)' }}>
                {user?.role === 'hospital' ? 'HOSPITAL DOCTORS & TIMETABLES' : 'YOUR TIMETABLE'}
              </div>

              {user?.role === 'hospital' ? (
                <div className="flex flex-col gap-6">
                  {(!profile?.doctors || profile.doctors.length === 0) ? (
                    <div className="pixel-inset" style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--map-bg)', color: 'rgba(255,255,255,0.3)', fontSize: 18, letterSpacing: 2 }}>
                      NO DOCTORS ADDED YET.
                    </div>
                  ) : (
                    profile.doctors.map((docItem: any) => (
                      <div key={docItem.id} className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 20, borderLeft: '4px solid var(--btn-cyan)' }}>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <div style={{ fontSize: 24, color: 'var(--white)', letterSpacing: 2 }}>{docItem.name}</div>
                            <div style={{ fontSize: 16, color: 'var(--btn-cyan)', letterSpacing: 1 }}>{docItem.specialty}</div>
                          </div>
                        </div>

                        {/* Ranges List */}
                        <div className="mb-4">
                          {(!docItem.ranges || docItem.ranges.length === 0) ? (
                             <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>NO TIME RANGES SET</div>
                          ) : (
                             docItem.ranges.map((r: any, idx: number) => (
                               <div key={idx} className="flex gap-4 items-center mb-2 flex-wrap" style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '6px 12px' }}>
                                 <span style={{ color: 'var(--btn-green)', fontSize: 18 }}>{r.start}</span>
                                 <span style={{ color: 'var(--white)' }}>TO</span>
                                 <span style={{ color: 'var(--btn-red)', fontSize: 18 }}>{r.end}</span>
                                 <span style={{ color: 'var(--btn-cyan)', fontSize: 14 }}>[{r.type?.toUpperCase() || 'BOTH'}]</span>
                                 {(r.type === 'in-person' || r.type === 'both' || !r.type) && r.address && (
                                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>📍 {r.address}</span>
                                 )}
                                 <button onClick={() => removeRange(idx, docItem.id)} className="retro-btn retro-btn-red pixel-border ml-auto" style={{ padding: '2px 8px', fontSize: 14 }}>✕</button>
                               </div>
                             ))
                          )}
                        </div>

                        {/* Add Range Form */}
                        <form onSubmit={(e) => handleAddRange(e, docItem.id)} className="flex gap-3 items-end flex-wrap">
                          <div>
                            <label className="retro-label block mb-1" style={{ fontSize: 14 }}>START</label>
                            <input type="time" required value={newRangeStart} onChange={e => setNewRangeStart(e.target.value)} className="retro-input" style={{ padding: '4px 8px' }} />
                          </div>
                          <div>
                            <label className="retro-label block mb-1" style={{ fontSize: 14 }}>END</label>
                            <input type="time" required value={newRangeEnd} onChange={e => setNewRangeEnd(e.target.value)} className="retro-input" style={{ padding: '4px 8px' }} />
                          </div>
                          <div>
                            <label className="retro-label block mb-1" style={{ fontSize: 14 }}>TYPE</label>
                            <select value={newRangeType} onChange={e => setNewRangeType(e.target.value as any)} className="retro-select" style={{ padding: '4px 8px' }}>
                              <option value="both">Both</option>
                              <option value="online">Online Only</option>
                              <option value="in-person">In-Person Only</option>
                            </select>
                          </div>
                          {newRangeType !== "online" && (
                            <div>
                              <label className="retro-label block mb-1" style={{ fontSize: 14 }}>ADDRESS</label>
                              <input type="text" value={newRangeAddress} onChange={e => setNewRangeAddress(e.target.value)} className="retro-input" style={{ padding: '4px 8px' }} placeholder="123 Fake St..." />
                            </div>
                          )}
                          <button type="submit" className="retro-btn retro-btn-white pixel-border" style={{ fontSize: 16, padding: '6px 12px' }}>+ ADD</button>
                        </form>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 20 }}>
                  <div style={{ fontSize: 20, color: 'var(--btn-orange)', letterSpacing: 2, marginBottom: 16 }}>AVAILABLE TIME RANGES</div>
                  
                  {/* Ranges List */}
                  <div className="mb-6">
                    {(!profile?.ranges || profile.ranges.length === 0) ? (
                       <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>NO TIME RANGES SET</div>
                    ) : (
                       profile.ranges.map((r: any, idx: number) => (
                         <div key={idx} className="flex gap-4 items-center mb-2 flex-wrap" style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 16px' }}>
                           <span style={{ color: 'var(--btn-green)', fontSize: 20 }}>{r.start}</span>
                           <span style={{ color: 'var(--white)' }}>TO</span>
                           <span style={{ color: 'var(--btn-red)', fontSize: 20 }}>{r.end}</span>
                           <span style={{ color: 'var(--btn-cyan)', fontSize: 16 }}>[{r.type?.toUpperCase() || 'BOTH'}]</span>
                           {(r.type === 'in-person' || r.type === 'both' || !r.type) && r.address && (
                             <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>📍 {r.address}</span>
                           )}
                           <button onClick={() => removeRange(idx, null)} className="retro-btn retro-btn-red pixel-border ml-auto" style={{ padding: '4px 10px', fontSize: 16 }}>✕ REMOVE</button>
                         </div>
                       ))
                    )}
                  </div>

                  {/* Add Range Form */}
                  <form onSubmit={(e) => handleAddRange(e, null)} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1" style={{ minWidth: 120 }}>
                      <label className="retro-label block mb-1">START TIME</label>
                      <input type="time" required value={newRangeStart} onChange={e => setNewRangeStart(e.target.value)} className="retro-input" />
                    </div>
                    <div className="flex-1" style={{ minWidth: 120 }}>
                      <label className="retro-label block mb-1">END TIME</label>
                      <input type="time" required value={newRangeEnd} onChange={e => setNewRangeEnd(e.target.value)} className="retro-input" />
                    </div>
                    <div className="flex-1" style={{ minWidth: 150 }}>
                      <label className="retro-label block mb-1">CONSULTATION TYPE</label>
                      <select value={newRangeType} onChange={e => setNewRangeType(e.target.value as any)} className="retro-select">
                        <option value="both">Both</option>
                        <option value="online">Online Only</option>
                        <option value="in-person">In-Person Only</option>
                      </select>
                    </div>
                    {newRangeType !== "online" && (
                      <div className="flex-1" style={{ minWidth: 200 }}>
                        <label className="retro-label block mb-1">ADDRESS (OPTIONAL)</label>
                        <input type="text" value={newRangeAddress} onChange={e => setNewRangeAddress(e.target.value)} className="retro-input" placeholder="123 Fake St, City..." />
                      </div>
                    )}
                    <button type="submit" className="retro-btn retro-btn-white pixel-border" style={{ fontSize: 18 }}>+ ADD</button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
