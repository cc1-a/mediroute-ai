"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function AdminQueuePage() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "Tickets"), where("status", "==", "pending_admin"));
    const unsubscribe = onSnapshot(q, snapshot => {
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
    } catch { alert("Failed to update ticket"); }
  };

  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  return (
    <div className="min-h-screen p-4" style={s}>
      <div className="max-w-5xl mx-auto">

        {/* Header device bar */}
        <div
          className="flex items-center justify-between mb-6"
          style={{
            backgroundColor: 'var(--bg-panel)',
            padding: '16px 20px',
            boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black), 4px 8px 0 var(--black), 8px 4px 0 var(--black), 8px 8px 0 var(--black)',
          }}
        >
          <div>
            <div style={{ color: 'var(--btn-red)', fontSize: 30, letterSpacing: 5, textShadow: '2px 2px 0 var(--black)' }}>
              🕷 ADMIN DASHBOARD
            </div>
            <div style={{ color: 'var(--black)', fontSize: 17, letterSpacing: 2 }}>REVIEW PATIENT TRIAGE SUBMISSIONS</div>
          </div>
          <div
            className="pixel-border"
            style={{ backgroundColor: 'var(--btn-red)', color: 'var(--white)', padding: '8px 16px', fontSize: 22, letterSpacing: 3 }}
          >
            {tickets.length} PENDING
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <div style={{ color: 'var(--btn-green)', fontSize: 28, letterSpacing: 4 }}>ALL CLEAR!</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, marginTop: 8, letterSpacing: 2 }}>
              NO PENDING TRIAGE SUBMISSIONS.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="pixel-inset flex flex-col justify-between"
                style={{ backgroundColor: 'var(--map-bg)', padding: 16 }}
              >
                {/* Ticket header */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div style={{ color: 'var(--white)', fontSize: 20, letterSpacing: 1 }}>{ticket.patient_name}</div>
                    <span
                      className="retro-badge"
                      style={{
                        backgroundColor: ticket.urgency_level >= 4 ? 'var(--btn-red)' : 'var(--btn-yellow)',
                        color: ticket.urgency_level >= 4 ? 'var(--white)' : 'var(--black)',
                        fontSize: 15,
                      }}
                    >
                      LVL {ticket.urgency_level}
                    </span>
                  </div>

                  {/* Raw symptoms */}
                  <div
                    className="pixel-inset mb-3"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '10px 12px' }}
                  >
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 2, marginBottom: 4 }}>
                      PATIENT WORDS:
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, fontStyle: 'italic' }}>
                      "{ticket.raw_symptoms}"
                    </div>
                  </div>

                  {/* AI summary */}
                  <div
                    className="pixel-inset mb-3"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 12px' }}
                  >
                    <div style={{ color: 'var(--btn-cyan)', fontSize: 14, letterSpacing: 2, marginBottom: 4 }}>AI SUMMARY:</div>
                    <div style={{ color: 'var(--white)', fontSize: 17 }}>{ticket.core_symptoms}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>
                      {ticket.required_specialty} · {ticket.location}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-2">
                  <button
                    id={`emergency-${ticket.id}`}
                    onClick={() => handleReview(ticket.id, true)}
                    className="retro-btn retro-btn-red pixel-border flex-1"
                    style={{ fontSize: 18, color: 'var(--white)' }}
                  >
                    🚨 EMERGENCY
                  </button>
                  <button
                    id={`approve-${ticket.id}`}
                    onClick={() => handleReview(ticket.id, false)}
                    className="retro-btn retro-btn-green pixel-border flex-1"
                    style={{ fontSize: 18 }}
                  >
                    ✅ APPROVE
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
