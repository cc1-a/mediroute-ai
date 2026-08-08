"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-20 flex flex-col items-center justify-center text-white text-center relative overflow-hidden">
      
      {/* Spider-Man background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px]" />
      </div>

      <main className="z-10 max-w-3xl flex flex-col items-center">
        <h1 className="text-6xl sm:text-8xl font-black mb-4 tracking-tighter" style={{ color: 'var(--spidey-red)' }}>
          WEB<span className="text-white">ROUTE</span>
        </h1>
        <p className="text-xl sm:text-2xl text-blue-200 mb-12 font-medium tracking-wide max-w-xl">
          Next-Generation AI Triage & Medical Dispatch System.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
          
          <Link href="/patient/triage" className="group glass-panel p-8 rounded-2xl border border-white/20 hover:border-red-500 transition-all hover:scale-105">
            <h2 className="text-2xl font-bold mb-2 text-white">Patient Portal</h2>
            <p className="text-gray-400 text-sm">Submit symptoms & book doctors</p>
          </Link>

          <Link href="/admin/queue" className="group glass-panel p-8 rounded-2xl border border-white/20 hover:border-blue-500 transition-all hover:scale-105">
            <h2 className="text-2xl font-bold mb-2 text-white">S.H.I.E.L.D Queue</h2>
            <p className="text-gray-400 text-sm">Admin Triage Approval</p>
          </Link>
          
          <Link href="/doctor/dashboard" className="group glass-panel p-8 rounded-2xl border border-white/20 hover:border-blue-500 transition-all hover:scale-105">
            <h2 className="text-2xl font-bold mb-2 text-white">Doctor Dashboard</h2>
            <p className="text-gray-400 text-sm">Manage consultations</p>
          </Link>
          
          <Link href="/doctor/schedule" className="group glass-panel p-8 rounded-2xl border border-white/20 hover:border-blue-500 transition-all hover:scale-105">
            <h2 className="text-2xl font-bold mb-2 text-white">Doctor Schedule</h2>
            <p className="text-gray-400 text-sm">Manage time slots</p>
          </Link>
        </div>

        <Link href="/admin/radar" className="w-full max-w-2xl group glass-panel-red p-6 rounded-2xl border border-red-500/30 hover:bg-red-900/40 transition-all">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Global Outbreak Radar</h2>
        </Link>
      </main>
      
      <footer className="absolute bottom-8 z-10 text-gray-500 text-sm font-bold tracking-widest uppercase">
        Powered by Groq & Pinecone
      </footer>
    </div>
  );
}
