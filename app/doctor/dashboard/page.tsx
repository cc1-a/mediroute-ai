"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Ticket = {
  id: string;
  patient_name: string;
  core_symptoms: string;
  urgency_level: number;
  location: string;
  status: string;
};

export default function DoctorDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const q = query(collection(db, "Tickets"), where("status", "==", "pending"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketsData: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() } as Ticket);
      });
      // Sort by urgency descending
      ticketsData.sort((a, b) => b.urgency_level - a.urgency_level);
      setTickets(ticketsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptTicket = async (ticketId: string) => {
    try {
      const ticketRef = doc(db, "Tickets", ticketId);
      await updateDoc(ticketRef, {
        status: "accepted"
      });
    } catch (error) {
      console.error("Error accepting ticket:", error);
    }
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 5: return "bg-red-100 border-red-500 text-red-900 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse";
      case 4: return "bg-orange-100 border-orange-500 text-orange-900";
      case 3: return "bg-yellow-100 border-yellow-500 text-yellow-900";
      case 2: return "bg-blue-100 border-blue-500 text-blue-900";
      case 1: return "bg-green-100 border-green-500 text-green-900";
      default: return "bg-gray-100 border-gray-500 text-gray-900";
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-900 mb-8">Doctor Dashboard: Active Queue</h1>
        
        {tickets.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl text-gray-500">No pending tickets at the moment.</h3>
            <p className="text-gray-400 mt-2">The queue is clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={`p-6 rounded-2xl border-l-4 transition-all duration-300 flex flex-col ${getUrgencyColor(ticket.urgency_level)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{ticket.patient_name}</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-white/50 backdrop-blur-sm">
                    Level {ticket.urgency_level}
                  </span>
                </div>
                
                <div className="flex-grow space-y-3">
                  <div>
                    <p className="text-sm font-semibold opacity-75 uppercase tracking-wider">Location</p>
                    <p className="font-medium">{ticket.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold opacity-75 uppercase tracking-wider">Symptoms Summary</p>
                    <p className="font-medium line-clamp-3">{ticket.core_symptoms}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptTicket(ticket.id)}
                  className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg"
                >
                  Accept Ticket
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
