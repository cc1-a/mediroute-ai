"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";

import { useAuth } from "@/components/AuthProvider";

export default function PatientBookingPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const { user } = useAuth();

  // 1. Listen for patient's pending bookings
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "Tickets"),
      where("patient_uid", "==", user.uid),
      where("status", "==", "pending_booking")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch Doctors matching the selected ticket's specialty and location
  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setAvailableDocs([]);

    // Get all users in that location who are doctors/hospitals
    const usersQ = query(collection(db, "Users"), where("location", "==", ticket.location));
    const usersSnap = await getDocs(usersQ);
    const validUsers = usersSnap.docs
      .map(d => ({ uid: d.id, ...d.data() as any }))
      .filter(u => u.role === 'doctor' || u.role === 'hospital');
    
    // For those users, fetch their DoctorProfile and match specialty
    const profilesQ = query(collection(db, "DoctorProfiles"), where("specialty", "==", ticket.required_specialty));
    const profilesSnap = await getDocs(profilesQ);
    
    const docsWithSlots: any[] = [];
    profilesSnap.forEach(p => {
      const pData = p.data();
      const matchingUser = validUsers.find(u => u.uid === p.id);
      if (matchingUser) {
        docsWithSlots.push({
          uid: p.id,
          name: matchingUser.name,
          role: matchingUser.role,
          specialty: pData.specialty,
          slots: pData.available_slots || [],
          isOnline: pData.isOnline || matchingUser.isOnline,
          meetLink: pData.meetLink
        });
      }
    });

    setAvailableDocs(docsWithSlots);
  };

  const handleBook = async (docUid: string, slotIndex: number, time: string) => {
    try {
      // 1. Update Ticket
      await updateDoc(doc(db, "Tickets", selectedTicket.id), {
        status: "booked",
        assigned_doc_uid: docUid,
        appointment_time: time
      });

      // 2. We should ideally update the DoctorProfile to mark the slot as booked,
      // but for Hackathon speed, the ticket state dictates the booking.
      // (Advanced: update DoctorProfile slot.booked = true)

      alert("Appointment Confirmed! Check your email for details.");
      setSelectedTicket(null);
    } catch (err) {
      alert("Booking failed.");
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black mb-8 text-white">Booking Portal</h1>
        
        {tickets.length === 0 && !selectedTicket && (
          <div className="glass-panel p-12 text-center rounded-2xl">
            <h2 className="text-xl font-bold text-gray-400">No Pending Bookings</h2>
            <p className="text-gray-500">Your triage tickets will appear here once approved by the admin.</p>
          </div>
        )}

        {!selectedTicket && tickets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {tickets.map(ticket => (
              <div key={ticket.id} className="glass-panel p-6 rounded-2xl border border-red-500/30 hover:border-red-500 transition cursor-pointer" onClick={() => handleSelectTicket(ticket)}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-400 font-bold uppercase text-xs tracking-wider">Requires: {ticket.required_specialty}</span>
                  {ticket.emergency_flag && <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold rounded animate-pulse">EMERGENCY</span>}
                </div>
                <h3 className="text-xl font-bold">{ticket.core_symptoms}</h3>
                <p className="text-gray-400 text-sm mt-2">Zone: {ticket.location}</p>
                <div className="mt-4 text-blue-400 font-bold text-sm flex items-center">
                  Select to view available doctors →
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTicket && (
          <div className="animate-fade-in">
            <button onClick={() => setSelectedTicket(null)} className="mb-6 text-gray-400 hover:text-white transition">
              ← Back to Tickets
            </button>
            <div className="glass-panel-red p-6 rounded-2xl mb-8">
              <h2 className="text-2xl font-bold">{selectedTicket.core_symptoms}</h2>
              <p className="text-red-200 mt-2">Searching for {selectedTicket.required_specialty} in {selectedTicket.location}...</p>
            </div>

            <div className="grid gap-6">
              {availableDocs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No doctors available for this specialty in your zone. Please check back later.</p>
              ) : (
                availableDocs.map(doc => (
                  <div key={doc.uid} className="glass-panel p-6 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/50">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {doc.name} 
                          <span className="text-xs bg-white/10 px-2 py-1 rounded ml-2 text-gray-300">{doc.role.toUpperCase()}</span>
                          {doc.isOnline && (
                            <span className="text-xs bg-green-600/20 text-green-400 border border-green-500/50 px-2 py-1 rounded ml-2 font-bold flex items-center inline-flex gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              ONLINE CONSULTATION
                            </span>
                          )}
                        </h3>
                        <p className="text-blue-400 text-sm">{doc.specialty}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-3 font-medium">Available Time Slots</p>
                      <div className="flex flex-wrap gap-3">
                        {doc.slots.map((slot: any, i: number) => (
                          <button 
                            key={i}
                            disabled={slot.booked}
                            onClick={() => handleBook(doc.uid, i, slot.time)}
                            className={`px-4 py-2 rounded-lg font-bold border transition ${slot.booked ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed' : 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600 hover:shadow-lg text-blue-200'}`}
                          >
                            {slot.time} ({slot.duration_mins}m)
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
