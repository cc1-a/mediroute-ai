"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { login } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "Users"));
      setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen p-8 flex items-center justify-center relative bg-[#020617] text-white">
      <div className="z-10 w-full max-w-xl glass-panel p-12 rounded-2xl border border-white/20">
        <h1 className="text-4xl font-black text-center mb-8" style={{ color: 'var(--spidey-red)' }}>WEB ROUTE LOGIN</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-300">Patients</h2>
            <div className="grid grid-cols-2 gap-4">
              {users.filter(u => u.role === "patient").map(u => (
                <button key={u.uid} onClick={() => login(u)} className="p-3 bg-white/5 hover:bg-red-600/30 border border-white/10 hover:border-red-500 transition rounded-xl font-bold">
                  {u.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-300">Doctors & Hospitals</h2>
            <div className="grid grid-cols-2 gap-4">
              {users.filter(u => u.role === "doctor" || u.role === "hospital").map(u => (
                <button key={u.uid} onClick={() => login(u)} className="p-3 bg-white/5 hover:bg-blue-600/30 border border-white/10 hover:border-blue-500 transition rounded-xl font-bold text-sm">
                  {u.name} ({u.role})
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-300">S.H.I.E.L.D Admin</h2>
            <div className="grid grid-cols-1 gap-4">
              {users.filter(u => u.role === "admin").map(u => (
                <button key={u.uid} onClick={() => login(u)} className="p-4 bg-white/5 hover:bg-white/20 border border-white/10 transition rounded-xl font-bold text-lg text-center">
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
