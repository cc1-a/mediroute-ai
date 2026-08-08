"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

const roles = [
  { id: "patient", label: "Patient", icon: "🏥", desc: "Find doctors & book appointments" },
  { id: "doctor", label: "Doctor", icon: "👨‍⚕️", desc: "Manage your consultations" },
  { id: "hospital", label: "Hospital", icon: "🏨", desc: "Multi-doctor facility dashboard" },
  { id: "admin", label: "Admin", icon: "🛡️", desc: "System oversight & triage review" },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password !== "password") {
      setError("Invalid password. (Hint: it's 'password')");
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "Users"), where("username", "==", username));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("User not found. Make sure you've seeded the database first.");
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

  const handleSeed = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch('/api/seed');
      if (res.ok) {
        setSeeded(true);
        setError("✅ Database seeded! All accounts are ready.");
      } else {
        setError("Failed to seed database.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-900/15 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter mb-1">
            MEDI<span className="text-red-600">ROUTE</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">Sign in to your account</p>
        </div>

        {!selectedRole ? (
          /* Step 1: Role Selection */
          <div className="space-y-3">
            <p className="text-center text-gray-400 text-sm mb-6 font-medium">I am a...</p>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all group text-left"
              >
                <span className="text-3xl">{role.icon}</span>
                <div>
                  <div className="font-bold text-white group-hover:text-red-400 transition">{role.label}</div>
                  <div className="text-xs text-gray-500">{role.desc}</div>
                </div>
                <span className="ml-auto text-gray-600 group-hover:text-white transition">→</span>
              </button>
            ))}

            {/* Seed button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleSeed}
                disabled={isLoading || seeded}
                className="w-full py-3 text-sm text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl font-bold transition disabled:opacity-50"
              >
                {isLoading ? "Seeding..." : seeded ? "✅ Database Ready" : "Seed Demo Database (First Time Setup)"}
              </button>
              {error && (
                <p className={`mt-3 text-xs text-center font-medium ${error.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{error}</p>
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Username + Password */
          <div>
            <button
              onClick={() => { setSelectedRole(null); setError(""); }}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium mb-8 transition"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3 mb-8 p-4 rounded-2xl border border-white/10 bg-white/5">
              <span className="text-2xl">{roles.find(r => r.id === selectedRole)?.icon}</span>
              <div>
                <div className="font-bold text-white capitalize">{selectedRole} Login</div>
                <div className="text-xs text-gray-500">{roles.find(r => r.id === selectedRole)?.desc}</div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white placeholder-gray-600"
                  placeholder={
                    selectedRole === 'patient' ? 'e.g. patient1' :
                    selectedRole === 'doctor' ? 'e.g. doctor1' :
                    selectedRole === 'hospital' ? 'e.g. hospital1' : 'admin'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white placeholder-gray-600"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-red-600 hover:bg-red-500 font-black text-lg rounded-xl transition disabled:opacity-50 shadow-lg shadow-red-900/30"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                <span>patient1–4</span>
                <span>admin</span>
                <span>doctor1–3</span>
                <span>hospital1–2</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">Password: <span className="text-gray-400 font-bold">password</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
