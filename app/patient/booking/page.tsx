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

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "Tickets"),
      where("patient_uid", "==", user.uid),
      where("status", "==", "pending_booking")
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setAvailableDocs([]);

    const usersQ = query(collection(db, "Users"), where("location", "==", ticket.location));
    const usersSnap = await getDocs(usersQ);
    const validUsers = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() as any })).filter(u => u.role === 'doctor' || u.role === 'hospital');

    const profilesQ = query(collection(db, "DoctorProfiles"), where("specialty", "==", ticket.required_specialty));
    const profilesSnap = await getDocs(profilesQ);

    const docsWithSlots: any[] = [];
    profilesSnap.forEach(p => {
      const pData = p.data();
      const matchingUser = validUsers.find(u => u.uid === p.id);
      if (matchingUser) {
        docsWithSlots.push({
          uid: p.id, name: matchingUser.name, role: matchingUser.role,
          specialty: pData.specialty, slots: pData.available_slots || [],
          isOnline: pData.isOnline || matchingUser.isOnline, meetLink: pData.meetLink
        });
      }
    });
    setAvailableDocs(docsWithSlots);
  };

  const handleBook = async (docUid: string, slotIndex: number, time: string) => {
    try {
      await updateDoc(doc(db, "Tickets", selectedTicket.id), {
        status: "booked", assigned_doc_uid: docUid, appointment_time: time
      });
      alert("Appointment Confirmed!");
      setSelectedTicket(null);
    } catch { alert("Booking failed."); }
  };

  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  return (
    <div className="min-h-screen p-4" style={s}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="pixel-inset mb-6" style={{ backgroundColor: 'var(--map-bg)', padding: '14px 18px' }}>
          <div style={{ color: 'var(--btn-red)', fontSize: 30, letterSpacing: 5, textShadow: '2px 2px 0 var(--black)' }}>
            [ BOOKING PORTAL ]
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, letterSpacing: 2 }}>SELECT A DOCTOR & CONFIRM YOUR SLOT</div>
        </div>

        {tickets.length === 0 && !selectedTicket && (
          <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: '50px', textAlign: 'center' }}>
            <div style={{ fontSize: 50, marginBottom: 12 }}>📭</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, letterSpacing: 3 }}>NO PENDING BOOKINGS</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 17, marginTop: 8 }}>Tickets appear here once admin approves your triage.</div>
          </div>
        )}

        {!selectedTicket && tickets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map(ticket => (
              <button
                key={ticket.id}
                id={`ticket-${ticket.id}`}
                onClick={() => handleSelectTicket(ticket)}
                className="pixel-border text-left"
                style={{ backgroundColor: 'var(--map-bg)', padding: '16px', color: 'var(--white)', cursor: 'pointer', border: 'none' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span style={{ color: 'var(--btn-red)', fontSize: 15, letterSpacing: 2 }}>
                    REQUIRES: {ticket.required_specialty?.toUpperCase()}
                  </span>
                  {ticket.emergency_flag && (
                    <span className="retro-badge blink" style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', fontSize: 13 }}>
                      🚨 EMERGENCY
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 22, letterSpacing: 1, marginBottom: 6 }}>{ticket.core_symptoms}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>ZONE: {ticket.location}</div>
                <div style={{ color: 'var(--btn-cyan)', fontSize: 16, marginTop: 8, letterSpacing: 1 }}>
                  SELECT TO VIEW DOCTORS →
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedTicket && (
          <div>
            <button
              id="back-tickets-btn"
              onClick={() => setSelectedTicket(null)}
              className="retro-btn retro-btn-panel pixel-border mb-4"
              style={{ fontSize: 18 }}
            >
              ◀ BACK TO TICKETS
            </button>

            <div className="pixel-border mb-6" style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', padding: '14px 18px' }}>
              <div style={{ fontSize: 22, letterSpacing: 2 }}>{selectedTicket.core_symptoms}</div>
              <div style={{ fontSize: 17, opacity: 0.8, marginTop: 4 }}>
                SEARCHING FOR {selectedTicket.required_specialty?.toUpperCase()} IN {selectedTicket.location?.toUpperCase()}...
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {availableDocs.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, textAlign: 'center', padding: '40px 0' }}>
                  NO DOCTORS AVAILABLE IN THIS SPECIALTY/ZONE.
                </div>
              ) : (
                availableDocs.map(d => (
                  <div key={d.uid} className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 16 }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div style={{ width: 44, height: 44, backgroundColor: 'var(--btn-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'var(--font-retro)', color: 'var(--black)' }}>
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: 'var(--white)', fontSize: 22, letterSpacing: 2 }}>
                          {d.name}
                          <span className="retro-badge ml-2" style={{ backgroundColor: 'var(--map-bg)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                            {d.role?.toUpperCase()}
                          </span>
                          {d.isOnline && (
                            <span className="retro-badge ml-2" style={{ backgroundColor: 'var(--btn-green)', color: 'var(--black)', fontSize: 13 }}>
                              ● ONLINE
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'var(--btn-cyan)', fontSize: 18 }}>{d.specialty}</div>
                      </div>
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, letterSpacing: 2, marginBottom: 8 }}>
                      AVAILABLE TIME SLOTS:
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {d.slots.map((slot: any, i: number) => (
                        <button
                          key={i}
                          disabled={slot.booked}
                          onClick={() => handleBook(d.uid, i, slot.time)}
                          className="retro-btn pixel-border"
                          style={{
                            fontSize: 18,
                            backgroundColor: slot.booked ? '#444' : 'var(--btn-green)',
                            color: slot.booked ? 'rgba(255,255,255,0.3)' : 'var(--black)',
                            cursor: slot.booked ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {slot.time} ({slot.duration_mins}m)
                        </button>
                      ))}
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
