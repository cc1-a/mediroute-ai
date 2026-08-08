"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function DoctorDashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicine, setMedicine] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "Tickets"),
      where("status", "==", "booked"),
      where("assigned_doc_uid", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      data.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(data);
    });
    return () => unsubscribe();
  }, [user]);

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

  const dashboardTitle = user?.role === 'hospital' ? 'Hospital Dashboard' : 'Doctor Dashboard';

  return (
    <div className="min-h-screen bg-black text-white flex gap-0">

      {/* Sidebar */}
      <div className="w-80 border-r border-white/10 flex flex-col min-h-screen">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black tracking-tight">{dashboardTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-2">Today's Appointments ({tickets.length})</p>

          {tickets.length === 0 && (
            <div className="text-center py-12 text-gray-600 text-sm">No appointments today.</div>
          )}

          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => { setActiveConsultation(ticket); setDiagnosis(""); setMedicine(""); }}
              className={`w-full text-left p-4 rounded-xl mb-2 transition ${
                activeConsultation?.id === ticket.id
                  ? 'bg-red-600/20 border border-red-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-white">{ticket.patient_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  ticket.urgency_level >= 4 ? 'bg-red-900/50 text-red-400' : 'bg-white/10 text-gray-400'
                }`}>Lvl {ticket.urgency_level}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{ticket.core_symptoms}</p>
              <p className="text-xs text-gray-600 mt-1">{ticket.appointment_time}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 p-8">
        {!activeConsultation ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-700">
            <div className="text-6xl mb-4">🩺</div>
            <h2 className="text-2xl font-black text-gray-500">Select a Patient</h2>
            <p className="text-gray-600 mt-2 text-sm">Click an appointment from the queue to begin.</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black">{activeConsultation.patient_name}</h2>
                {activeConsultation.emergency_flag && (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-full animate-pulse">EMERGENCY</span>
                )}
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Urgency: <span className="text-white font-bold">Level {activeConsultation.urgency_level}</span></span>
                <span>·</span>
                <span>Zone: <span className="text-white font-bold">{activeConsultation.location}</span></span>
                <span>·</span>
                <span>Time: <span className="text-white font-bold">{activeConsultation.appointment_time}</span></span>
              </div>
            </div>

            <div className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patient Symptoms</p>
              <p className="text-white">{activeConsultation.core_symptoms}</p>
              {activeConsultation.raw_symptoms !== activeConsultation.core_symptoms && (
                <p className="text-gray-600 text-sm mt-2 italic">Raw: "{activeConsultation.raw_symptoms}"</p>
              )}
            </div>

            <form onSubmit={handleComplete} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Diagnosis</label>
                <textarea
                  required
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition placeholder-gray-600 resize-none"
                  placeholder="Enter your diagnosis..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Prescribed Medicine</label>
                <textarea
                  required
                  value={medicine}
                  onChange={e => setMedicine(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition placeholder-gray-600 resize-none"
                  placeholder="Enter medicine and dosage..."
                />
              </div>
              <button
                type="submit"
                disabled={isCompleting}
                className="w-full py-4 bg-red-600 hover:bg-red-500 font-black text-lg rounded-2xl transition disabled:opacity-50 shadow-lg shadow-red-900/30"
              >
                {isCompleting ? "Saving..." : "Complete Consultation & Save to Records"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
