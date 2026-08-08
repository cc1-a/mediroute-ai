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

  // Schedule management state
  const [profile, setProfile] = useState<any>(null);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [newSlotDuration, setNewSlotDuration] = useState("15");
  const [newSlotRoom, setNewSlotRoom] = useState("Room 1");
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    
    // Fetch booked and pending_confirmation tickets
    const q = query(
      collection(db, "Tickets"),
      where("assigned_doc_uid", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const allData = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const bookedData = allData.filter(t => t.status === "booked");
      bookedData.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(bookedData);
      
      const pendingData = allData.filter(t => t.status === "pending_confirmation");
      pendingData.sort((a, b) => b.urgency_level - a.urgency_level);
      setPendingTickets(pendingData);
    });

    // Fetch DoctorProfile
    const fetchProfile = async () => {
      const docRef = doc(db, "DoctorProfiles", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };
    fetchProfile();

    return () => unsubscribe();
  }, [user]);

  const handleConfirmAppointment = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, "Tickets", ticketId), { status: "booked" });
    } catch (e) {
      alert("Failed to confirm appointment");
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleting(true);
    try {
      await updateDoc(doc(db, "Tickets", activeConsultation.id), { status: "completed" });
      await addDoc(collection(db, "MedicalLogs"), {
        ticket_id: activeConsultation.id,
        patient_uid: activeConsultation.patient_uid,
        patient_name: activeConsultation.patient_name,
        final_diagnosis: diagnosis,
        medicine: medicine,
        location: activeConsultation.location,
        timestamp: serverTimestamp(),
      });
      setActiveConsultation(null);
      setDiagnosis("");
      setMedicine("");
      alert("Consultation saved to patient's medical records.");
    } catch {
      alert("Failed to complete consultation.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTime || !profile || !user?.uid) return;
    
    setIsSavingSlot(true);
    try {
      const formattedTime = format(new Date(newSlotTime), "hh:mm a, MMM dd");
      
      const newSlot = {
        time: formattedTime,
        duration_mins: parseInt(newSlotDuration),
        room: newSlotRoom,
        booked: false,
      };

      const updatedSlots = [...(profile.available_slots || []), newSlot];
      
      await setDoc(doc(db, "DoctorProfiles", user.uid), {
        ...profile,
        available_slots: updatedSlots
      }, { merge: true });
      
      setProfile({ ...profile, available_slots: updatedSlots });
      setNewSlotTime("");
    } catch (e) {
      alert("Failed to add slot.");
    } finally {
      setIsSavingSlot(false);
    }
  };

  const removeSlot = async (index: number) => {
    if (!profile || !user?.uid) return;
    try {
      const updatedSlots = profile.available_slots.filter((_: any, i: number) => i !== index);
      await setDoc(doc(db, "DoctorProfiles", user.uid), {
        ...profile,
        available_slots: updatedSlots
      }, { merge: true });
      setProfile({ ...profile, available_slots: updatedSlots });
    } catch (e) {
      alert("Failed to remove slot");
    }
  };

  const dashboardTitle = user?.role === 'hospital' ? 'Hospital Dashboard' : 'Doctor Dashboard';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Nav for Dashboard Tabs */}
      <div className="border-b border-white/10 p-6 flex items-center justify-between bg-black/80 sticky top-0 z-10 backdrop-blur">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{dashboardTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.name}</p>
        </div>
        <div className="flex gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setTab("queue")} 
            className={`px-6 py-2 rounded-lg font-bold transition text-sm ${tab === "queue" ? "bg-red-600 shadow-lg shadow-red-900/30" : "hover:bg-white/10"}`}
          >
            Consultation Queue
          </button>
          <button 
            onClick={() => setTab("schedule")} 
            className={`px-6 py-2 rounded-lg font-bold transition text-sm ${tab === "schedule" ? "bg-red-600 shadow-lg shadow-red-900/30" : "hover:bg-white/10"}`}
          >
            Manage Schedule
          </button>
        </div>
      </div>

      {tab === "queue" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-96 border-r border-white/10 flex flex-col min-h-0 bg-white/[0.02]">
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              
              {/* Pending Section */}
              <div>
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-4 px-2 flex justify-between items-center">
                  <span>Pending Confirmation</span>
                  <span className="bg-yellow-500/20 px-2 py-0.5 rounded-full">{pendingTickets.length}</span>
                </p>
                {pendingTickets.length === 0 && (
                  <div className="text-center py-6 text-gray-600 text-sm italic">No pending requests.</div>
                )}
                <div className="space-y-3">
                  {pendingTickets.map(ticket => (
                    <div key={ticket.id} className="p-4 rounded-xl bg-yellow-900/10 border border-yellow-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-white">{ticket.patient_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-300">
                          {ticket.appointment_time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{ticket.consultation_type === 'in-person' ? '🏥 In-Person' : '💻 Online'} · {ticket.room}</p>
                      <p className="text-xs text-gray-500 mb-3 truncate">{ticket.core_symptoms}</p>
                      
                      <button
                        onClick={() => handleConfirmAppointment(ticket.id)}
                        className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition"
                      >
                        Confirm Appointment
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booked Section */}
              <div>
                <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-4 px-2 flex justify-between items-center">
                  <span>Confirmed Appointments</span>
                  <span className="bg-green-500/20 px-2 py-0.5 rounded-full">{tickets.length}</span>
                </p>
                {tickets.length === 0 && (
                  <div className="text-center py-6 text-gray-600 text-sm italic">No confirmed appointments today.</div>
                )}
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => { setActiveConsultation(ticket); setDiagnosis(""); setMedicine(""); }}
                      className={`w-full text-left p-4 rounded-xl transition ${
                        activeConsultation?.id === ticket.id
                          ? 'bg-red-600/20 border border-red-500/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-white">{ticket.patient_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          ticket.urgency_level >= 4 ? 'bg-red-900/50 text-red-400' : 'bg-white/10 text-gray-400'
                        }`}>Lvl {ticket.urgency_level}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{ticket.consultation_type === 'in-person' ? '🏥 In-Person' : '💻 Online'} · {ticket.room}</p>
                      <p className="text-xs text-gray-500 truncate">{ticket.core_symptoms}</p>
                      <p className="text-xs text-green-400 font-bold mt-2">{ticket.appointment_time}</p>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 p-8 overflow-y-auto">
            {!activeConsultation ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700">
                <div className="text-6xl mb-4 opacity-50">🩺</div>
                <h2 className="text-2xl font-black text-gray-500">Select an Appointment</h2>
                <p className="text-gray-600 mt-2 text-sm">Click a confirmed appointment from the queue to begin.</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-4xl font-black">{activeConsultation.patient_name}</h2>
                      {activeConsultation.emergency_flag && (
                        <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-full animate-pulse shadow-lg shadow-red-900/50">EMERGENCY</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Urgency: <span className="text-white font-bold">Level {activeConsultation.urgency_level}</span></span>
                      <span>·</span>
                      <span>Time: <span className="text-white font-bold">{activeConsultation.appointment_time}</span></span>
                      <span>·</span>
                      <span className="text-blue-400 font-bold">{activeConsultation.room}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Ticket ID</p>
                    <p className="font-mono text-sm bg-white/10 px-3 py-1 rounded-lg border border-white/10">{activeConsultation.id}</p>
                    
                    {activeConsultation.consultation_type === "platform-video" && (
                      <button 
                        onClick={() => router.push(`/patient/consultation/${activeConsultation.id}`)}
                        className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition"
                      >
                        Join Video Call
                      </button>
                    )}
                    {activeConsultation.consultation_type === "google-meet" && (
                      <a 
                        href={profile?.meetLink || "#"} target="_blank" rel="noopener noreferrer"
                        className="mt-3 w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg transition inline-block text-center"
                      >
                        Join Meet
                      </a>
                    )}
                  </div>
                </div>

                <div className="mb-6 p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Triage Summary</p>
                  <p className="text-white text-lg font-medium leading-relaxed mb-4">{activeConsultation.core_symptoms}</p>
                  {activeConsultation.raw_symptoms !== activeConsultation.core_symptoms && (
                    <div className="bg-black/50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Patient's Exact Words</p>
                      <p className="text-gray-400 text-sm italic">"{activeConsultation.raw_symptoms}"</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleComplete} className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-black mb-4">Post-Consultation Log</h3>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Final Diagnosis</label>
                    <textarea
                      required
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                      rows={3}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition placeholder-gray-600 resize-none"
                      placeholder="Enter the official diagnosis..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Prescribed Medicine / Actions</label>
                    <textarea
                      required
                      value={medicine}
                      onChange={e => setMedicine(e.target.value)}
                      rows={3}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition placeholder-gray-600 resize-none"
                      placeholder="e.g. Paracetamol 500mg, rest for 2 days"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCompleting}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 font-black text-lg rounded-2xl transition disabled:opacity-50 shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                  >
                    {isCompleting ? "Saving to Records..." : "Mark as Complete & Save Log"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Create Slot Form */}
            <div className="md:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sticky top-8">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <span className="text-red-500">📅</span> Add New Slot
                </h2>
                
                <form onSubmit={handleAddSlot} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newSlotTime}
                      onChange={e => setNewSlotTime(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Duration (mins)</label>
                    <select
                      value={newSlotDuration}
                      onChange={e => setNewSlotDuration(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    >
                      <option value="10">10 mins (Quick Consult)</option>
                      <option value="15">15 mins (Standard)</option>
                      <option value="30">30 mins (Extended)</option>
                      <option value="60">60 mins (Specialist)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Room / Line</label>
                    <input 
                      type="text" 
                      required
                      value={newSlotRoom}
                      onChange={e => setNewSlotRoom(e.target.value)}
                      placeholder="e.g. Room 1, Line A"
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSlot}
                    className="w-full py-4 bg-white hover:bg-gray-200 text-black font-black rounded-xl transition disabled:opacity-50 mt-4"
                  >
                    {isSavingSlot ? "Adding..." : "Add to Schedule"}
                  </button>
                </form>
              </div>
            </div>

            {/* Current Schedule View */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-black mb-6">Current Schedule Configuration</h2>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 border-b border-white/10 text-gray-400 uppercase tracking-wider font-bold text-xs">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Room</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(!profile?.available_slots || profile.available_slots.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 italic">No available slots configured. Add one from the sidebar.</td>
                      </tr>
                    ) : (
                      profile.available_slots.map((slot: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition">
                          <td className="p-4 font-bold">{slot.time}</td>
                          <td className="p-4 text-blue-400 font-medium">{slot.room || "Room 1"}</td>
                          <td className="p-4 text-gray-400">{slot.duration_mins || 15}m</td>
                          <td className="p-4">
                            {slot.booked ? (
                              <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-bold border border-red-500/20">Booked</span>
                            ) : (
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-bold border border-green-500/20">Available</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => removeSlot(idx)}
                              className="text-red-500 hover:text-red-400 font-bold text-xs bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl">
                <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <span>ℹ️</span> Pro Tip for Hospitals
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  You can specify the <strong>Room / Line</strong> field to direct patients to specific departments or doctors within your hospital. For example, "Cardiology - Dr. Smith" or "Room 402". Patients will see this room assignment on their confirmed ticket.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
