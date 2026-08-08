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
      if (pDoc.exists()) {
        setProfile(pDoc.data());
      }
    };
    fetchProfile();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const formattedTime = lineName ? `${time} - ${lineName}` : time;

    const newSlot = {
      time: formattedTime,
      duration_mins: parseInt(duration),
      booked: false
    };

    const updatedSlots = [...(profile.available_slots || []), newSlot];
    
    await updateDoc(doc(db, "DoctorProfiles", doctorUid), {
      available_slots: updatedSlots
    });

    setProfile({ ...profile, available_slots: updatedSlots });
    setTime("");
    setLineName("");
  };

  if (!profile) return <div className="p-8 text-white">Loading schedule...</div>;

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-8" style={{ color: 'var(--spidey-blue)' }}>Slot Management</h1>
        
        <div className="glass-panel p-8 rounded-2xl border border-blue-500/30 mb-8">
          <h2 className="text-xl font-bold mb-6">Add New Available Time Slot</h2>
          <form onSubmit={handleAddSlot} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-bold text-gray-300 mb-2">Time (e.g. 10:30 AM)</label>
              <input 
                type="text" 
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                placeholder="10:30 AM"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-bold text-gray-300 mb-2">Line / Dr. Name (Hospitals)</label>
              <input 
                type="text" 
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                placeholder="e.g. Dr. Smith / Line 2"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-bold text-gray-300 mb-2">Mins</label>
              <input 
                type="number" 
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                placeholder="15"
              />
            </div>
            <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-500/30 transition">
              Add Slot
            </button>
          </form>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold mb-6 text-gray-300">Your Active Slots</h2>
          {(!profile.available_slots || profile.available_slots.length === 0) ? (
            <p className="text-gray-500">No slots created yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.available_slots.map((slot: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border ${slot.booked ? 'bg-red-900/30 border-red-500/30 text-red-200' : 'bg-blue-900/30 border-blue-500/30'}`}>
                  <p className="font-bold text-lg">{slot.time}</p>
                  <p className="text-sm opacity-75">{slot.duration_mins} mins</p>
                  <p className="text-xs font-bold mt-2 uppercase tracking-wider">{slot.booked ? 'Booked' : 'Available'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
