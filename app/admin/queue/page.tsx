"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";

export default function AdminQueuePage() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "Tickets"),
      where("status", "==", "pending_admin")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any));
      // Sort by urgency locally (since Firestore needs a composite index to sort by urgency while querying status)
      fetchedTickets.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(fetchedTickets);
    });

    return () => unsubscribe();
  }, []);

  const handleReview = async (ticketId: string, isEmergency: boolean) => {
    try {
      await updateDoc(doc(db, "Tickets", ticketId), {
        status: "pending_booking",
        emergency_flag: isEmergency
      });
    } catch (err) {
      alert("Failed to update ticket");
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 glass-panel p-6 rounded-2xl border border-blue-500/30">
          <div>
            <h1 className="text-3xl font-black" style={{ color: 'var(--spidey-red)' }}>S.H.I.E.L.D. Triage Queue</h1>
            <p className="text-gray-300">Admin Emergency Override & Approval</p>
          </div>
          <div className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-500/30">
            {tickets.length} Pending
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map(ticket => (
            <div key={ticket.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-bl-full -mr-4 -mt-4 transition group-hover:bg-blue-500/20" />
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">{ticket.patient_name}</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${ticket.urgency_level >= 4 ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'}`}>
                    Level {ticket.urgency_level}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  "{ticket.raw_symptoms}"
                </p>
                
                <div className="bg-[#0a192f] p-3 rounded-lg mb-6 border border-white/5">
                  <p className="text-xs text-blue-300 font-bold mb-1">AI SUMMARY</p>
                  <p className="text-sm font-medium">{ticket.core_symptoms}</p>
                  <p className="text-xs text-gray-400 mt-2">Spec: {ticket.required_specialty} | Zone: {ticket.location}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleReview(ticket.id, true)}
                  className="flex-1 bg-red-600 hover:bg-red-700 font-bold py-2 rounded-lg transition shadow-lg shadow-red-500/20 text-sm"
                >
                  FLAG EMERGENCY
                </button>
                <button 
                  onClick={() => handleReview(ticket.id, false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold py-2 rounded-lg transition shadow-lg shadow-blue-500/20 text-sm"
                >
                  STANDARD
                </button>
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="col-span-full glass-panel p-12 text-center rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-400">Queue is clear!</h2>
              <p className="text-gray-500">No pending triages to review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
