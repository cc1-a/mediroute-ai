"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DoctorDashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  
  const [diagnosis, setDiagnosis] = useState("");
  const [medicine, setMedicine] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // For demo purposes, we fetch all 'booked' tickets (Normally filtered by assigned_doc_uid)
    const q = query(collection(db, "Tickets"), where("status", "==", "booked"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: any[] = [];
      querySnapshot.forEach((d) => {
        ticketsData.push({ id: d.id, ...d.data() });
      });
      // Sort by urgency descending
      ticketsData.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(ticketsData);
    });

    return () => unsubscribe();
  }, []);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleting(true);
    
    try {
      // 1. Mark ticket completed
      await updateDoc(doc(db, "Tickets", activeConsultation.id), {
        status: "completed"
      });

      // 2. Add to MedicalLogs
      await addDoc(collection(db, "MedicalLogs"), {
        ticket_id: activeConsultation.id,
        patient_uid: activeConsultation.patient_uid,
        patient_name: activeConsultation.patient_name,
        final_diagnosis: diagnosis,
        medicine: medicine,
        location: activeConsultation.location,
        timestamp: serverTimestamp()
      });

      setActiveConsultation(null);
      setDiagnosis("");
      setMedicine("");
      alert("Consultation Complete! Saved to Medical Logs.");
    } catch (err) {
      alert("Failed to complete consultation");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white flex gap-8">
      
      {/* Sidebar: Queue */}
      <div className="w-1/3 glass-panel p-6 rounded-2xl flex flex-col border border-blue-500/30">
        <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--spidey-red)' }}>Spider-Web Clinic</h1>
        <h2 className="text-gray-400 font-bold mb-4 uppercase text-sm tracking-wider">Booked Appointments</h2>
        
        <div className="overflow-y-auto space-y-4 flex-grow pr-2">
          {tickets.length === 0 && (
            <p className="text-gray-500 text-center py-8">No booked appointments right now.</p>
          )}
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              onClick={() => {
                setActiveConsultation(ticket);
                setDiagnosis("");
                setMedicine("");
              }}
              className={`p-4 rounded-xl border cursor-pointer transition ${activeConsultation?.id === ticket.id ? 'bg-blue-900/50 border-blue-400 shadow-[0_0_15px_rgba(4,82,180,0.5)]' : 'glass-panel border-white/10 hover:border-blue-500/50'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{ticket.patient_name}</h3>
                <span className="text-xs bg-red-600 px-2 py-1 rounded font-bold">{ticket.appointment_time}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-1">{ticket.core_symptoms}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Consultation */}
      <div className="w-2/3 glass-panel p-8 rounded-2xl border border-white/10">
        {!activeConsultation ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-24 h-24 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            <h2 className="text-2xl font-bold mb-2">Ready for Patients</h2>
            <p>Select an appointment from the queue to start consultation.</p>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{activeConsultation.patient_name}</h2>
                <div className="flex gap-3 text-sm font-bold">
                  <span className="text-red-400 uppercase tracking-wider">Level {activeConsultation.urgency_level}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-blue-400 uppercase tracking-wider">{activeConsultation.location}</span>
                </div>
              </div>
              {activeConsultation.emergency_flag && (
                <span className="bg-red-600 text-white px-4 py-2 text-sm font-bold rounded shadow-lg shadow-red-500/50 animate-pulse">
                  EMERGENCY FLAGGED
                </span>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Patient Symptoms (AI Parsed)</h3>
              <p className="bg-white/5 p-4 rounded-xl border border-white/5">{activeConsultation.core_symptoms}</p>
            </div>
            <div className="mb-8">
              <h3 className="text-gray-400 font-bold mb-2 text-sm uppercase">Raw Input</h3>
              <p className="text-gray-400 italic text-sm">{activeConsultation.raw_symptoms}</p>
            </div>

            <form onSubmit={handleComplete} className="mt-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-300 font-bold mb-2 text-sm uppercase">Diagnosis</label>
                  <textarea 
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                    placeholder="Enter final diagnosis..."
                  />
                </div>
                <div>
                  <label className="block text-blue-300 font-bold mb-2 text-sm uppercase">Prescribed Medicine</label>
                  <textarea 
                    required
                    value={medicine}
                    onChange={(e) => setMedicine(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                    placeholder="Enter medicine and dosage..."
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isCompleting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 font-black text-lg rounded-xl shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
              >
                {isCompleting ? "Saving Log..." : "Complete Consultation & Save Log"}
              </button>
            </form>
          </div>
        )}
      </div>
      
    </div>
  );
}
