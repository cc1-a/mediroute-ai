"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function AdminQueuePage() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "Tickets"), where("status", "==", "pending_admin"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      fetched.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(fetched);
    });
    return () => unsubscribe();
  }, []);

  const handleReview = async (ticketId: string, isEmergency: boolean) => {
    try {
      await updateDoc(doc(db, "Tickets", ticketId), {
        status: "pending_booking",
        emergency_flag: isEmergency,
      });
    } catch {
      alert("Failed to update ticket");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Review patient triage submissions and approve bookings.</p>
          </div>
          <div className="px-4 py-2 bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm">
            {tickets.length} Pending
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-500">All clear!</h2>
            <p className="text-gray-600 mt-2">No pending triage submissions to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-white">{ticket.patient_name}</h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      ticket.urgency_level >= 4
                        ? 'bg-red-900/40 text-red-300 border border-red-500/40'
                        : 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      Level {ticket.urgency_level}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 italic">"{ticket.raw_symptoms}"</p>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                    <p className="text-xs text-blue-400 font-bold mb-1 uppercase">AI Summary</p>
                    <p className="text-sm text-white">{ticket.core_symptoms}</p>
                    <p className="text-xs text-gray-500 mt-2">{ticket.required_specialty} · {ticket.location}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleReview(ticket.id, true)}
                    className="flex-1 bg-red-600 hover:bg-red-500 font-bold py-2.5 rounded-xl transition text-sm"
                  >
                    🚨 Emergency
                  </button>
                  <button
                    onClick={() => handleReview(ticket.id, false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-2.5 rounded-xl transition text-sm"
                  >
                    ✅ Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
