"use client";

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden selection:bg-red-900 selection:text-white">
      
      {/* Premium Minimalistic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        
        {/* Spider Logo Image with Screen blend mode to remove any black bg artifacts */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-60 md:opacity-100 pointer-events-none" style={{ mixBlendMode: 'screen' }}>
          <Image 
            src="/spider_logo.jpg" 
            alt="Spider Logo" 
            fill
            className="object-contain animate-pulse-slow"
            priority
          />
        </div>

        <div className="px-8 sm:px-20 max-w-7xl w-full mx-auto relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase mb-8">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              System Online
            </div>
            
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black mb-6 tracking-tighter leading-none text-white">
              WEB<br/><span style={{ color: 'var(--spidey-red)' }}>ROUTE</span>
            </h1>
            
            <p className="text-lg sm:text-2xl text-gray-400 mb-12 font-medium leading-relaxed max-w-lg">
              Next-generation autonomous medical triage. Precision routing powered by artificial intelligence.
            </p>

            {!user ? (
              <button 
                onClick={() => router.push('/login')}
                className="group flex items-center gap-4 px-10 py-5 bg-white text-black hover:bg-gray-200 transition-all rounded-full font-black text-xl"
              >
                Enter WebRoute
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            ) : (
              <div className="flex flex-wrap gap-4 max-w-xl">
                {user.role === 'patient' && (
                  <>
                    <Link href="/patient/triage" className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-center transition">Run Triage</Link>
                    <Link href="/patient/booking" className="px-8 py-4 border border-white/20 hover:border-white rounded-full font-bold text-center transition">My Bookings</Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link href="/admin/queue" className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-center transition">Review Queue</Link>
                    <Link href="/admin/radar" className="px-8 py-4 border border-white/20 hover:border-white rounded-full font-bold text-center transition">Outbreak Radar</Link>
                  </>
                )}
                {(user.role === 'doctor' || user.role === 'hospital') && (
                  <>
                    <Link href="/doctor/dashboard" className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-full font-bold text-center transition">Consultations</Link>
                    <Link href="/doctor/schedule" className="px-8 py-4 border border-white/20 hover:border-white rounded-full font-bold text-center transition">Manage Schedule</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-32 relative border-t border-white/10">
        <div className="absolute left-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-30 pointer-events-none" style={{ mixBlendMode: 'screen' }}>
          <Image 
            src="/shield_logo.jpg" 
            alt="Shield Logo" 
            fill
            className="object-contain"
          />
        </div>
        
        <div className="px-8 sm:px-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-end relative z-10">
          <div className="w-full md:w-1/2 md:pl-20">
            <h2 className="text-sm font-bold tracking-widest text-blue-500 mb-4 uppercase">S.H.I.E.L.D Integration</h2>
            <h3 className="text-4xl sm:text-5xl font-black mb-8 leading-tight">Unprecedented Security.<br/>Absolute Precision.</h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Every triage request is processed through our decentralized Pinecone vector database, ensuring instantaneous threat detection and localized outbreak isolation.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-black text-white mb-2">99.9%</div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-2">&lt;200ms</div>
                <div className="text-sm text-gray-500 font-bold uppercase tracking-widest">Latency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 flex flex-col items-center gap-8 bg-black relative z-10">
        <h2 className="text-2xl font-black tracking-tighter text-white">
          WEB<span style={{ color: 'var(--spidey-red)' }}>ROUTE</span>
        </h2>
        <p className="text-xs text-gray-600 font-bold tracking-widest uppercase">
          © 2024 NextGen Systems | Hackathon Edition
        </p>
      </footer>

      {/* Global minimal custom styles for this page */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(1.02); }
        }
      `}} />
    </div>
  );
}
