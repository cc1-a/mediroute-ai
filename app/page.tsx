"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';

// Spider-Man SVG inline
const SpideyHead = ({ size = 120 }: { size?: number }) => (
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
    <path d="M 110 140 C 130 110, 150 90, 175 100 C 160 135, 140 150, 110 140 Z"
          fill="#FFFFFF" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M 90 140 C 70 110, 50 90, 25 100 C 40 135, 60 150, 90 140 Z"
          fill="#FFFFFF" stroke="#000" strokeWidth="6" strokeLinejoin="round"/>
  </svg>
);

// Animated tracker blip
const TrackerBlip = () => {
  const [pos, setPos] = useState({ x: 50, y: 45 });
  useEffect(() => {
    const iv = setInterval(() => {
      setPos({
        x: 50 + (Math.random() * 6 - 3),
        y: 45 + (Math.random() * 6 - 3),
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="absolute w-8 h-8 flex items-center justify-center text-base pixel-border"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--btn-red)',
        transition: 'left 0.4s ease, top 0.4s ease',
        fontSize: '16px',
        zIndex: 5,
      }}
    >
      🕷
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCTA = () => {
    if (!user) { router.push('/login'); return; }
    if (user.role === 'patient') router.push('/patient/dashboard');
    else if (user.role === 'admin') router.push('/admin/queue');
    else if (user.role === 'doctor' || user.role === 'hospital') router.push('/doctor/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: 'var(--font-retro)' }}>

      {/* ── DEVICE CONTAINER ── */}
      <div
        className="w-full max-w-lg flex flex-col gap-0"
        style={{
          backgroundColor: 'var(--bg-panel)',
          padding: '20px',
          boxShadow: '0 -6px 0 var(--bg-panel), 0 6px 0 var(--bg-panel), -6px 0 0 var(--bg-panel), 6px 0 0 var(--bg-panel), 0 -10px 0 var(--black), 0 10px 0 var(--black), -10px 0 0 var(--black), 10px 0 0 var(--black)',
        }}
      >
        {/* ── MAP / LOGO SCREEN ── */}
        <div
          className="relative overflow-hidden scanlines"
          style={{
            height: '320px',
            backgroundColor: 'var(--map-bg)',
            backgroundImage: 'repeating-linear-gradient(25deg, transparent, transparent 40px, var(--map-grid) 40px, var(--map-grid) 44px), repeating-linear-gradient(-65deg, transparent, transparent 40px, var(--map-grid) 40px, var(--map-grid) 44px)',
            boxShadow: 'inset 0 4px 0 var(--black), inset 0 -4px 0 var(--black), inset 4px 0 0 var(--black), inset -4px 0 0 var(--black)',
          }}
        >
          {/* Ruler Left */}
          <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 10, borderRight: '2px solid rgba(255,255,255,0.6)', background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.6) 2px, transparent 2px, transparent 15px)' }} />
          {/* Ruler Top */}
          <div style={{ position: 'absolute', top: 10, left: 150, right: 0, height: 10, borderBottom: '2px solid rgba(255,255,255,0.6)', background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.6), rgba(255,255,255,0.6) 2px, transparent 2px, transparent 15px)' }} />

          {/* HUD Top Left */}
          <div className="absolute top-4 left-5 flex items-center gap-2 z-10">
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, backgroundColor: 'var(--map-bg)' }}>🕷</div>
            <div className="flex flex-col gap-1">
              <div style={{ height: 4, width: 50, backgroundColor: 'white' }} />
              <div style={{ height: 4, width: 30, backgroundColor: 'white' }} />
            </div>
          </div>

          {/* Side Tabs */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
            {['0','S','T'].map(l => (
              <div key={l} style={{
                backgroundColor: 'var(--btn-red)', color: 'var(--black)',
                fontSize: 20, padding: '3px 7px', fontFamily: 'var(--font-retro)',
                boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), 4px 0 0 var(--black), 4px 8px 0 var(--black), 8px 4px 0 var(--black), 8px 8px 0 var(--black)',
              }}>{l}</div>
            ))}
          </div>

          {/* Animated Spider Tracker Blip */}
          <TrackerBlip />

          {/* Center Logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ paddingTop: 20 }}>
            <SpideyHead size={90} />
            <div style={{ color: 'var(--white)', fontSize: 42, letterSpacing: 6, textShadow: '3px 3px 0 var(--black)', marginTop: 4 }}>
              MEDI<span style={{ color: 'var(--btn-red)' }}>ROUTE</span>
            </div>
          </div>

          {/* Bottom corner text */}
          <div className="absolute bottom-3 right-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 2, textShadow: '1px 1px 0 var(--black)' }}>
            COLOMBO
          </div>
        </div>

        {/* ── CONTROLS ── */}
        <div className="flex flex-col gap-3 mt-5">

          {/* Role / welcome row */}
          <div className="flex items-center justify-between px-1">
            <span style={{ fontSize: 20, color: 'var(--black)', letterSpacing: 2 }}>
              {user ? `[ ${user.name?.toUpperCase()} · ${user.role?.toUpperCase()} ]` : '[ SELECT UNIT ]'}
            </span>
            <span className="blink" style={{ color: 'var(--btn-red)', fontSize: 22 }}>■</span>
          </div>

          {/* Main CTA button */}
          <button
            id="main-cta-btn"
            onClick={handleCTA}
            className="retro-btn retro-btn-red pixel-border retro-btn-full"
          >
            {user ? `▶ GO TO DASHBOARD` : `▶ GET STARTED`}
          </button>

          {/* Sub-buttons row */}
          <div className="flex gap-3">
            <button
              id="triage-btn"
              onClick={() => user ? router.push('/patient/triage') : router.push('/login')}
              className="retro-btn retro-btn-green pixel-border flex-1"
              style={{ fontSize: 18 }}
            >
              AI TRIAGE
            </button>
            <button
              id="booking-btn"
              onClick={() => user ? router.push('/patient/booking') : router.push('/login')}
              className="retro-btn retro-btn-cyan pixel-border flex-1"
              style={{ fontSize: 18 }}
            >
              BOOKING
            </button>
            <button
              id="admin-btn"
              onClick={() => router.push('/admin/queue')}
              className="retro-btn retro-btn-orange pixel-border flex-1"
              style={{ fontSize: 18 }}
            >
              ADMIN
            </button>
          </div>

        </div>

        {/* ── FOOTER STRIP ── */}
        <div
          className="mt-5 text-center"
          style={{
            backgroundColor: 'var(--map-bg)',
            color: 'var(--white)',
            fontSize: 18,
            padding: '8px 12px',
            letterSpacing: 1,
            boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black)',
          }}
        >
          © MediRoute AI · HACKATHON EDITION · COLOMBO, SRI LANKA
        </div>
      </div>
    </div>
  );
}
