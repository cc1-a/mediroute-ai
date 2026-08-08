"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCTA = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'patient') router.push('/patient/dashboard');
    else if (user.role === 'admin') router.push('/admin/queue');
    else if (user.role === 'doctor' || user.role === 'hospital') router.push('/doctor/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-red-900">
      
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Spider logo - centered top */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        <div className="w-32 h-32 mb-8 relative" style={{ mixBlendMode: 'screen' }}>
          <Image
            src="/spider_logo.jpg"
            alt="MediRoute Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-7xl sm:text-9xl font-black tracking-tighter mb-4 leading-none">
          MEDI<span className="text-red-600">ROUTE</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 font-medium max-w-md mb-12 leading-relaxed">
          AI-powered medical triage and doctor booking for Sri Lanka. Fast. Precise. Connected.
        </p>

        <button
          onClick={handleCTA}
          className="px-12 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-full transition-all duration-300 shadow-2xl shadow-red-900/50 hover:shadow-red-600/50 hover:scale-105"
        >
          {user ? 'Go to Dashboard' : 'Get Started'}
        </button>

        {user && (
          <p className="mt-6 text-gray-500 text-sm">
            Logged in as <span className="text-white font-bold">{user.name}</span> ({user.role})
          </p>
        )}
      </div>

      {/* Bottom strip */}
      <div className="absolute bottom-8 text-center text-gray-700 text-xs font-bold tracking-widest uppercase">
        MediRoute AI · Hackathon Edition · Colombo, Sri Lanka
      </div>
    </div>
  );
}
