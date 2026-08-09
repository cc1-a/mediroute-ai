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
  const [newSlotTime, setNewSlotTime] = useState("");
  const [newSlotDuration, setNewSlotDuration] = useState("15");
  const [newSlotRoom, setNewSlotRoom] = useState("Room 1");
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

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTime || !profile || !user?.uid) return;
    setIsSavingSlot(true);
    try {
      const formattedTime = format(new Date(newSlotTime), "hh:mm a, MMM dd");
      const newSlot = { time: formattedTime, duration_mins: parseInt(newSlotDuration), room: newSlotRoom, booked: false };
      const updatedSlots = [...(profile.available_slots || []), newSlot];
      await setDoc(doc(db, "DoctorProfiles", user.uid), { ...profile, available_slots: updatedSlots }, { merge: true });
      setProfile({ ...profile, available_slots: updatedSlots });
      setNewSlotTime("");
    } catch { alert("Failed to add slot."); }
    finally { setIsSavingSlot(false); }
  };

  const removeSlot = async (index: number) => {
    if (!profile || !user?.uid) return;
    try {
      const updatedSlots = profile.available_slots.filter((_: any, i: number) => i !== index);
      await setDoc(doc(db, "DoctorProfiles", user.uid), { ...profile, available_slots: updatedSlots }, { merge: true });
      setProfile({ ...profile, available_slots: updatedSlots });
    } catch { alert("Failed to remove slot"); }
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

            {/* Add Slot Form */}
            <div className="md:col-span-1">
              <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 20 }}>
                <div style={{ color: 'var(--btn-orange)', fontSize: 22, letterSpacing: 3, marginBottom: 16 }}>
                  [ ADD SLOT ]
                </div>

                <form onSubmit={handleAddSlot} className="flex flex-col gap-4">
                  <div>
                    <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>DATE & TIME</label>
                    <input
                      type="datetime-local" required value={newSlotTime}
                      onChange={e => setNewSlotTime(e.target.value)}
                      className="retro-input"
                    />
                  </div>

                  <div>
                    <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>DURATION (MINS)</label>
                    <select value={newSlotDuration} onChange={e => setNewSlotDuration(e.target.value)} className="retro-select">
                      <option value="10">10 MINS (QUICK)</option>
                      <option value="15">15 MINS (STANDARD)</option>
                      <option value="30">30 MINS (EXTENDED)</option>
                      <option value="60">60 MINS (SPECIALIST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>ROOM / LINE</label>
                    <input
                      type="text" required value={newSlotRoom}
                      onChange={e => setNewSlotRoom(e.target.value)}
                      placeholder="E.G. ROOM 1, LINE A"
                      className="retro-input"
                    />
                  </div>

                  <button
                    id="add-slot-btn"
                    type="submit"
                    disabled={isSavingSlot}
                    className="retro-btn retro-btn-white pixel-border retro-btn-full"
                    style={{ fontSize: 20, opacity: isSavingSlot ? 0.6 : 1 }}
                  >
                    {isSavingSlot ? 'ADDING...' : '▶ ADD TO SCHEDULE'}
                  </button>
                </form>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="md:col-span-2">
              <div style={{ color: 'var(--white)', fontSize: 24, letterSpacing: 3, marginBottom: 16, fontFamily: 'var(--font-retro)' }}>
                CURRENT SCHEDULE CONFIG
              </div>

              <div className="pixel-inset overflow-hidden" style={{ backgroundColor: 'var(--map-bg)' }}>
                {/* Table header */}
                <div
                  className="grid font-bold"
                  style={{
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '10px 14px',
                    borderBottom: '3px solid var(--black)',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 14,
                    letterSpacing: 2,
                    fontFamily: 'var(--font-retro)',
                  }}
                >
                  <span>TIME</span><span>ROOM</span><span>DURATION</span><span>STATUS</span><span>ACT.</span>
                </div>

                {(!profile?.available_slots || profile.available_slots.length === 0) ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 18, letterSpacing: 2, fontFamily: 'var(--font-retro)' }}>
                    NO SLOTS CONFIGURED. ADD ONE FROM THE SIDEBAR.
                  </div>
                ) : (
                  profile.available_slots.map((slot: any, idx: number) => (
                    <div
                      key={idx}
                      className="grid items-center"
                      style={{
                        gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                        padding: '10px 14px',
                        borderBottom: '2px solid rgba(40,68,105,0.5)',
                        fontFamily: 'var(--font-retro)',
                      }}
                    >
                      <span style={{ color: 'var(--white)', fontSize: 18 }}>{slot.time}</span>
                      <span style={{ color: 'var(--btn-cyan)', fontSize: 17 }}>{slot.room || "Room 1"}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17 }}>{slot.duration_mins || 15}m</span>
                      <span>
                        <span
                          className="retro-badge"
                          style={{
                            backgroundColor: slot.booked ? 'var(--btn-red)' : 'var(--btn-green)',
                            color: slot.booked ? 'var(--white)' : 'var(--black)',
                            fontSize: 14,
                          }}
                        >
                          {slot.booked ? 'BOOKED' : 'AVAIL'}
                        </span>
                      </span>
                      <button
                        onClick={() => removeSlot(idx)}
                        className="retro-btn retro-btn-red pixel-border"
                        style={{ fontSize: 15, color: 'var(--white)', padding: '3px 8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Pro tip */}
              <div className="pixel-inset mt-5" style={{ backgroundColor: 'rgba(40,68,105,0.4)', padding: '14px 18px' }}>
                <div style={{ color: 'var(--btn-cyan)', fontSize: 18, letterSpacing: 2, marginBottom: 6 }}>ℹ PRO TIP FOR HOSPITALS</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, letterSpacing: 1, lineHeight: 1.5 }}>
                  Use the ROOM / LINE field to direct patients to specific departments — e.g. &quot;Cardiology - Dr. Smith&quot; or &quot;Room 402&quot;. Patients see this on their confirmed ticket.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
