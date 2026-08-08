"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PlatformVideo() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      const docSnap = await getDoc(doc(db, "Tickets", ticketId));
      if (docSnap.exists()) {
        setTicket(docSnap.data());
      }
      setLoading(false);
    };
    fetchTicket();
  }, [ticketId]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black">Connecting...</div>;

  if (!ticket) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black">Invalid Session</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black">MediRoute Video Platform</h1>
          <p className="text-gray-500 text-sm">Session ID: {ticketId}</p>
        </div>
        <button 
          onClick={() => router.push("/patient/dashboard")}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition shadow-lg shadow-red-900/30"
        >
          Leave Call
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden flex items-center justify-center">
          {/* Doctor Video Placeholder */}
          <div className="text-center">
            <div className="w-32 h-32 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-5xl">👨‍⚕️</span>
            </div>
            <h2 className="text-xl font-bold">Waiting for Doctor...</h2>
            <p className="text-gray-500">Your camera and mic are active.</p>
          </div>
          
          {/* Picture in Picture (Patient) */}
          <div className="absolute bottom-6 right-6 w-48 h-32 bg-black border-2 border-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
        </div>

        <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
          <h3 className="font-black text-lg mb-4">Live Chat</h3>
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            <div className="bg-white/10 p-3 rounded-xl rounded-tl-none self-start max-w-[80%] text-sm">
              <span className="font-bold text-red-400 block mb-1">System</span>
              Connecting you securely... Please wait.
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            <input type="text" placeholder="Type a message..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-500" />
            <button className="bg-red-600 px-4 rounded-xl font-bold">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
