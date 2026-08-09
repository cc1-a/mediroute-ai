"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function DoctorSchedulePage() {
  const [profile, setProfile] = useState<any>(null);
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("15");
  const [lineName, setLineName] = useState("");

  const { user } = useAuth();
  const doctorUid = user?.uid;

  useEffect(() => {
    if (!doctorUid) return;
    const fetchProfile = async () => {
      const pDoc = await getDoc(doc(db, "DoctorProfiles", doctorUid));
      if (pDoc.exists()) setProfile(pDoc.data());
    };
    fetchProfile();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const formattedTime = lineName ? `${time} - ${lineName}` : time;
    const newSlot = { time: formattedTime, duration_mins: parseInt(duration), booked: false };
    const updatedSlots = [...(profile.available_slots || []), newSlot];

    await updateDoc(doc(db, "DoctorProfiles", doctorUid), { available_slots: updatedSlots });
    setProfile({ ...profile, available_slots: updatedSlots });
    setTime("");
    setLineName("");
  };

  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={s}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24, letterSpacing: 3 }}>LOADING SCHEDULE...</div>
    </div>
  );

  return (
    <div className="min-h-screen p-4" style={s}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="pixel-inset mb-6" style={{ backgroundColor: 'var(--map-bg)', padding: '14px 18px' }}>
          <div style={{ color: 'var(--btn-cyan)', fontSize: 28, letterSpacing: 5, textShadow: '2px 2px 0 var(--black)' }}>
            [ SLOT MANAGEMENT ]
          </div>
        </div>

        {/* Add Slot Form */}
        <div className="pixel-inset mb-6" style={{ backgroundColor: 'var(--map-bg)', padding: 20 }}>
          <div style={{ color: 'var(--btn-orange)', fontSize: 22, letterSpacing: 3, marginBottom: 16 }}>
            ADD NEW TIME SLOT
          </div>
          <form onSubmit={handleAddSlot}>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1" style={{ minWidth: 140 }}>
                <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>TIME (E.G. 10:30 AM)</label>
                <input
                  type="text" required value={time}
                  onChange={e => setTime(e.target.value)}
                  className="retro-input"
                  placeholder="10:30 AM"
                />
              </div>
              <div className="flex-1" style={{ minWidth: 140 }}>
                <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>LINE / DR. NAME</label>
                <input
                  type="text" value={lineName}
                  onChange={e => setLineName(e.target.value)}
                  className="retro-input"
                  placeholder="E.G. DR. SMITH / LINE 2"
                />
              </div>
              <div style={{ width: 90 }}>
                <label className="retro-label block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>MINS</label>
                <input
                  type="number" required value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="retro-input"
                  placeholder="15"
                />
              </div>
              <button
                id="add-slot-btn"
                type="submit"
                className="retro-btn retro-btn-cyan pixel-border"
                style={{ fontSize: 20 }}
              >
                ▶ ADD
              </button>
            </div>
          </form>
        </div>

        {/* Slot Grid */}
        <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: 20 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, letterSpacing: 3, marginBottom: 16 }}>
            YOUR ACTIVE SLOTS
          </div>

          {(!profile.available_slots || profile.available_slots.length === 0) ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, letterSpacing: 2, padding: '30px 0', textAlign: 'center' }}>
              NO SLOTS CREATED YET.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.available_slots.map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className="pixel-inset"
                  style={{
                    backgroundColor: slot.booked ? 'rgba(226,54,54,0.2)' : 'rgba(133,185,197,0.2)',
                    padding: 14,
                  }}
                >
                  <div style={{ color: 'var(--white)', fontSize: 20, letterSpacing: 1 }}>{slot.time}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 17, marginTop: 4 }}>
                    {slot.duration_mins} MINS
                  </div>
                  <span
                    className="retro-badge"
                    style={{
                      display: 'inline-block', marginTop: 8,
                      backgroundColor: slot.booked ? 'var(--btn-red)' : 'var(--btn-green)',
                      color: slot.booked ? 'var(--white)' : 'var(--black)',
                      fontSize: 14,
                    }}
                  >
                    {slot.booked ? 'BOOKED' : 'AVAILABLE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
