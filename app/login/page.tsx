"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password !== "password") {
      setError("Invalid password. Hint: it is 'password'");
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "Users"), where("username", "==", username));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("User not found. Check your username.");
      } else {
        const userDoc = snap.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() };
        login(userData);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center relative bg-[#020617] text-white">
      <div className="z-10 w-full max-w-md glass-panel p-12 rounded-2xl border border-white/20 shadow-2xl">
        <h1 className="text-4xl font-black text-center mb-2 tracking-tighter" style={{ color: 'var(--spidey-red)' }}>WEB ROUTE</h1>
        <p className="text-center text-gray-400 mb-8 font-bold">Secure Login Portal</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white"
              placeholder="e.g. patient1, admin, hospital1"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 font-black text-lg rounded-xl shadow-lg shadow-red-500/30 transition disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "LOGIN"}
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-white/10 text-sm text-gray-400">
          <p className="mb-2 font-bold">Demo Accounts:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Patients:</strong> patient1, patient2, patient3, patient4</li>
            <li><strong>Admin:</strong> admin</li>
            <li><strong>Hospitals:</strong> hospital1, hospital2</li>
            <li><strong>Doctors:</strong> doctor1, doctor2, doctor3</li>
          </ul>
          <p className="mt-4 italic">Password for all accounts is <strong>password</strong></p>
        </div>
      </div>
    </div>
  );
}
