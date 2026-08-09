"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

const SpideyHead = ({ size = 80 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250" width={size} height={size * 1.25}>
    <ellipse cx="100" cy="125" rx="80" ry="110" fill="#E23636" stroke="#000" strokeWidth="4"/>
    <g stroke="#000" strokeWidth="2" fill="none">
      <line x1="100" y1="15" x2="100" y2="235" />
      <path d="M 40 60 L 160 190" /><path d="M 160 60 L 40 190" />
      <path d="M 25 100 L 175 150" /><path d="M 175 100 L 25 150" />
      <path d="M 100 45 Q 120 50 145 75 M 100 45 Q 80 50 55 75" />
      <path d="M 100 75 Q 130 80 165 110 M 100 75 Q 70 80 35 110" />
      <path d="M 100 200 Q 120 195 145 170 M 100 200 Q 80 195 55 170" />
      <path d="M 100 170 Q 130 165 165 135 M 100 170 Q 70 165 35 135" />
    </g>
    <path d="M 110 140 C 130 110, 150 90, 175 100 C 160 135, 140 150, 110 140 Z" fill="#FFFFFF" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M 90 140 C 70 110, 50 90, 25 100 C 40 135, 60 150, 90 140 Z" fill="#FFFFFF" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
  </svg>
);

const roles = [
  { id: "patient",  label: "PATIENT",  icon: "🏥", desc: "Find doctors & book appointments",  color: 'var(--btn-green)' },
  { id: "doctor",   label: "DOCTOR",   icon: "👨‍⚕️", desc: "Manage your consultations",          color: 'var(--btn-cyan)' },
  { id: "hospital", label: "HOSPITAL", icon: "🏨", desc: "Multi-doctor facility dashboard",     color: 'var(--btn-cyan)' },
  { id: "admin",    label: "ADMIN",    icon: "🛡️", desc: "System oversight & triage review",   color: 'var(--btn-orange)' },
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
      setError("!! INVALID PASSWORD (HINT: 'password')");
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "Users"), where("username", "==", username));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("!! USER NOT FOUND. SEED DATABASE FIRST.");
      } else {
        const userDoc = snap.docs[0];
        const userData = { uid: userDoc.id, ...userDoc.data() };
        login(userData);
      }
    } catch (err: any) {
      setError(err.message || "!! CONNECTION ERROR.");
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
        setError(">> DATABASE SEEDED SUCCESSFULLY.");
      } else {
        setError("!! SEED FAILED.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleObj = roles.find(r => r.id === selectedRole);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ fontFamily: 'var(--font-retro)' }}
    >
      {/* Device Container */}
      <div
        className="w-full max-w-sm flex flex-col gap-0"
        style={{
          backgroundColor: 'var(--bg-panel)',
          padding: '20px',
          boxShadow: '0 -6px 0 var(--bg-panel), 0 6px 0 var(--bg-panel), -6px 0 0 var(--bg-panel), 6px 0 0 var(--bg-panel), 0 -10px 0 var(--black), 0 10px 0 var(--black), -10px 0 0 var(--black), 10px 0 0 var(--black)',
        }}
      >
        {/* Screen Header */}
        <div
          className="relative overflow-hidden scanlines flex flex-col items-center justify-center gap-2 py-6"
          style={{
            backgroundColor: 'var(--map-bg)',
            backgroundImage: 'repeating-linear-gradient(25deg, transparent, transparent 40px, var(--map-grid) 40px, var(--map-grid) 44px), repeating-linear-gradient(-65deg, transparent, transparent 40px, var(--map-grid) 40px, var(--map-grid) 44px)',
            boxShadow: 'inset 0 4px 0 var(--black), inset 0 -4px 0 var(--black), inset 4px 0 0 var(--black), inset -4px 0 0 var(--black)',
          }}
        >
          <SpideyHead size={70} />
          <div style={{ color: 'var(--white)', fontSize: 36, letterSpacing: 5, textShadow: '2px 2px 0 var(--black)' }}>
            MEDI<span style={{ color: 'var(--btn-red)' }}>ROUTE</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, letterSpacing: 3 }}>
            {selectedRole ? `UNIT: ${selectedRole.toUpperCase()}` : 'SELECT YOUR UNIT'}
          </div>
        </div>

        {/* Controls Area */}
        <div className="flex flex-col gap-3 mt-4">

          {!selectedRole ? (
            /* ─ STEP 1: Role Selection ─ */
            <>
              <div style={{ color: 'var(--black)', fontSize: 18, letterSpacing: 2, textAlign: 'center', marginBottom: 4 }}>
                [ I AM A... ]
              </div>

              {roles.map(role => (
                <button
                  key={role.id}
                  id={`role-${role.id}`}
                  onClick={() => setSelectedRole(role.id)}
                  className="retro-btn pixel-border retro-btn-full flex items-center gap-3"
                  style={{ backgroundColor: role.color, textAlign: 'left', fontSize: 22 }}
                >
                  <span>{role.icon}</span>
                  <div className="flex flex-col">
                    <span>{role.label}</span>
                    <span style={{ fontSize: 14, opacity: 0.7, textTransform: 'none', letterSpacing: 0 }}>{role.desc}</span>
                  </div>
                  <span className="ml-auto">▶</span>
                </button>
              ))}

              {/* Seed Button */}
              <div style={{ borderTop: '4px solid var(--black)', marginTop: 4, paddingTop: 12 }}>
                <button
                  id="seed-db-btn"
                  onClick={handleSeed}
                  disabled={isLoading || seeded}
                  className="retro-btn retro-btn-blue pixel-border retro-btn-full"
                  style={{ fontSize: 18, opacity: (isLoading || seeded) ? 0.6 : 1 }}
                >
                  {isLoading ? 'SEEDING...' : seeded ? '>> DB READY' : '[ SEED DEMO DATABASE ]'}
                </button>
              </div>
            </>
          ) : (
            /* ─ STEP 2: Login Form ─ */
            <>
              <button
                id="back-btn"
                onClick={() => { setSelectedRole(null); setError(''); }}
                className="retro-btn retro-btn-panel pixel-border"
                style={{ fontSize: 18, textAlign: 'left' }}
              >
                ◀ BACK
              </button>

              {/* Selected role badge */}
              <div
                className="flex items-center gap-3 pixel-border"
                style={{ backgroundColor: selectedRoleObj?.color || 'var(--btn-green)', padding: '10px 14px' }}
              >
                <span style={{ fontSize: 26 }}>{selectedRoleObj?.icon}</span>
                <div>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-retro)', textTransform: 'uppercase', letterSpacing: 2 }}>{selectedRole} LOGIN</div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>{selectedRoleObj?.desc}</div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div>
                  <label className="retro-label block mb-1" style={{ color: 'var(--black)' }}>USERNAME</label>
                  <input
                    id="username-input"
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="retro-input"
                    placeholder={
                      selectedRole === 'patient' ? 'e.g. patient1' :
                      selectedRole === 'doctor'  ? 'e.g. doctor1'  :
                      selectedRole === 'hospital'? 'e.g. hospital1': 'admin'
                    }
                  />
                </div>

                <div>
                  <label className="retro-label block mb-1" style={{ color: 'var(--black)' }}>PASSWORD</label>
                  <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="retro-input"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div
                    className="pixel-border"
                    style={{
                      backgroundColor: error.startsWith('>>') ? 'var(--btn-green)' : 'var(--btn-red)',
                      color: 'var(--black)',
                      fontFamily: 'var(--font-retro)',
                      fontSize: 16,
                      padding: '8px 12px',
                      letterSpacing: 1,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="retro-btn retro-btn-red pixel-border retro-btn-full"
                  style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                  {isLoading ? 'SIGNING IN...' : '▶ SIGN IN'}
                </button>
              </form>

              {/* Demo accounts */}
              <div
                className="pixel-inset"
                style={{
                  backgroundColor: 'var(--map-bg)',
                  color: 'var(--white)',
                  padding: '10px 14px',
                  fontSize: 16,
                  letterSpacing: 1,
                }}
              >
                <div style={{ color: 'var(--btn-orange)', marginBottom: 6 }}>[ DEMO ACCOUNTS ]</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 15 }}>
                  <span>patient1–4</span><span>admin</span>
                  <span>doctor1–3</span><span>hospital1–2</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: 14 }}>
                  PWD: <span style={{ color: 'var(--white)' }}>password</span>
                </div>
              </div>
            </>
          )}

          {/* Error without role selected */}
          {!selectedRole && error && (
            <div
              className="pixel-border"
              style={{
                backgroundColor: error.startsWith('>>') ? 'var(--btn-green)' : 'var(--btn-red)',
                color: 'var(--black)',
                fontFamily: 'var(--font-retro)',
                fontSize: 16,
                padding: '8px 12px',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="mt-5 text-center"
          style={{
            backgroundColor: 'var(--map-bg)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 15,
            padding: '8px 12px',
            letterSpacing: 1,
            boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black)',
          }}
        >
          © DAILY BUGLE TRACKING SYSTEMS · COLOMBO
        </div>
      </div>
    </div>
  );
}
