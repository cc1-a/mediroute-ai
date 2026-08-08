"use client";

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { PlayCircle, ShieldAlert, Stethoscope, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      
      {/* Background Web Pattern Overlay */}
      <div className="fixed inset-0 web-pattern opacity-40 pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 px-8 sm:px-20 max-w-7xl mx-auto flex flex-col justify-center">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold tracking-widest text-gray-400 mb-2 uppercase">Welcome to the</h2>
          <h1 className="text-7xl sm:text-9xl font-black mb-6 tracking-tighter leading-none" style={{ color: 'var(--spidey-red)' }}>
            WEB<span className="text-white">ROUTE</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-10 font-medium leading-relaxed max-w-lg">
            Dive into the thrilling world of WebRoute's AI-powered medical dispatch. Navigate the bustling streets of healthcare, thwart notorious wait times, and uncover a compelling narrative that brings modern medicine to life like never before.
          </p>

          {!user ? (
            <button 
              onClick={() => router.push('/login')}
              className="px-10 py-4 bg-red-600 hover:bg-red-700 transition-all rounded-full font-black text-xl shadow-[0_0_25px_rgba(226,54,54,0.4)] hover:shadow-[0_0_35px_rgba(226,54,54,0.6)]"
            >
              Dive Into WebRoute
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {user.role === 'patient' && (
                <>
                  <Link href="/patient/triage" className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-center">Run Triage</Link>
                  <Link href="/patient/booking" className="px-6 py-4 glass-panel hover:bg-white/10 rounded-xl font-bold text-center">Bookings</Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/queue" className="px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-center">Review Queue</Link>
                  <Link href="/admin/radar" className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-center">Radar</Link>
                </>
              )}
              {(user.role === 'doctor' || user.role === 'hospital') && (
                <>
                  <Link href="/doctor/dashboard" className="px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-center">Consultations</Link>
                  <Link href="/doctor/schedule" className="px-6 py-4 glass-panel hover:bg-white/10 rounded-xl font-bold text-center">Schedule</Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Feature Thumbnails (Mimicking the video placeholders in design) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="aspect-[16/9] glass-panel rounded-2xl flex items-center justify-center group cursor-pointer hover:border-red-500 transition-all overflow-hidden relative">
            <div className="absolute inset-0 bg-red-600/10 group-hover:bg-red-600/20 transition-all" />
            <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all z-10" />
            <span className="absolute bottom-4 left-4 font-bold tracking-widest text-xs">AI SYMPTOM PARSING</span>
          </div>
          <div className="aspect-[16/9] glass-panel rounded-2xl flex items-center justify-center group cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative">
            <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all" />
            <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all z-10" />
            <span className="absolute bottom-4 left-4 font-bold tracking-widest text-xs">S.H.I.E.L.D RADAR</span>
          </div>
          <div className="aspect-[16/9] glass-panel rounded-2xl flex items-center justify-center group cursor-pointer hover:border-red-500 transition-all overflow-hidden relative">
            <div className="absolute inset-0 bg-red-600/10 group-hover:bg-red-600/20 transition-all" />
            <PlayCircle className="w-16 h-16 text-white opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all z-10" />
            <span className="absolute bottom-4 left-4 font-bold tracking-widest text-xs">INSTANT DISPATCH</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-8 sm:px-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
        <div className="w-full md:w-1/3 aspect-[9/16] glass-panel p-2 border-2 border-white/20 relative shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center flex-col text-center p-8">
            <Stethoscope className="w-24 h-24 text-red-600 mb-6" />
            <h3 className="font-bold text-xl uppercase tracking-widest mb-2">Web Triage</h3>
            <p className="text-sm text-gray-500">Autonomous analysis unit</p>
          </div>
        </div>
        
        <div className="w-full md:w-2/3 text-right">
          <h2 className="heading-red-dot text-4xl mb-8 justify-end">ABOUT</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8 font-medium">
            WebRoute, created by the visionary team at NextGen, is one of the most iconic and enduring healthcare solutions in modern tech. It first appeared in the "Amazing Hackathon" published in 2024. WebRoute's alter ego is a highly scalable AI triage engine that gains superpowers after being integrated with Groq LLMs and Pinecone Vector Databases.
          </p>
          <button className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full font-bold transition shadow-[0_0_15px_rgba(226,54,54,0.3)]">
            See More
          </button>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-8 sm:px-20 max-w-5xl mx-auto border-t border-b border-white/10 my-20 bg-black/50">
        <div className="flex flex-col md:flex-row justify-between items-center text-center gap-12">
          
          <div className="relative">
            <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-2 uppercase">PHASE 1</h3>
            <h2 className="text-4xl font-black mb-4">SEPTEMBER <span style={{ color: 'var(--spidey-red)' }}>2024</span></h2>
            <p className="text-sm font-bold tracking-widest uppercase mb-4">DEPLOY AI TRIAGE</p>
            <div className="flex justify-center gap-4 text-gray-500">
              <span className="font-black text-2xl">GROQ</span>
            </div>
          </div>
          
          <div className="hidden md:block w-32 border-t-2 border-dotted border-red-600 relative">
            <div className="absolute top-1/2 left-0 w-3 h-3 bg-red-600 rounded-full -translate-y-1/2 -translate-x-1/2 shadow-[0_0_10px_red]" />
            <div className="absolute top-1/2 right-0 w-3 h-3 bg-red-600 rounded-full -translate-y-1/2 translate-x-1/2 shadow-[0_0_10px_red]" />
          </div>

          <div className="relative">
            <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-2 uppercase">PHASE 2</h3>
            <h2 className="text-4xl font-black mb-4">OCTOBER <span style={{ color: 'var(--spidey-red)' }}>2024</span></h2>
            <p className="text-sm font-bold tracking-widest uppercase mb-4">GLOBAL OUTBREAK RADAR</p>
            <div className="flex justify-center gap-4 text-gray-500">
              <span className="font-black text-2xl">PINECONE</span>
            </div>
          </div>
          
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 sm:px-20 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center">
        
        <div className="feature-box w-full md:w-1/3">
          <h3 className="text-lg font-black tracking-widest mb-4">CUSTOMIZED AI PARSING</h3>
          <div className="red-dotted-underline"></div>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            The customized WebRoute engine will feature a unique design that balances clinical accuracy and speed while remaining true to the medical universe. Patients will have access to a diverse range of specialists, including traditional hospitals as well as alternative online freelance doctors.
          </p>
          <button className="px-6 py-2 border border-white/30 hover:border-white hover:bg-white/10 rounded font-bold text-xs tracking-widest transition">
            FULL STORY
          </button>
        </div>

        <div className="w-full md:w-1/3 flex justify-center py-12 relative">
          <div className="absolute inset-0 bg-red-600/5 rounded-full blur-[100px]" />
          <ShieldAlert className="w-48 h-48 text-red-600 drop-shadow-[0_0_30px_rgba(226,54,54,0.5)]" />
        </div>

        <div className="feature-box w-full md:w-1/3 bg-black">
          <h3 className="text-lg font-black tracking-widest mb-4">ALL ABOUT SPEED</h3>
          <div className="red-dotted-underline"></div>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            This isn't the dispatch system you've met or ever seen before. In WebRoute Remastered, we meet an experienced Admin who's more masterful at managing critical queues. At the same time, the system balances chaotic patient loads while the fate of the city rests upon its servers.
          </p>
          <button className="px-6 py-2 border border-white/30 hover:border-white hover:bg-white/10 rounded font-bold text-xs tracking-widest transition">
            FULL STORY
          </button>
        </div>

      </section>

      {/* Villains / Specialists Carousel */}
      <section className="py-32 px-8 sm:px-20 max-w-7xl mx-auto text-center">
        <h2 className="heading-red-dot text-4xl mb-16 mx-auto justify-center">TOP SPECIALISTS</h2>
        
        <div className="flex justify-center items-center gap-8">
          <div className="w-1/4 aspect-[9/16] glass-panel opacity-40 scale-90 border border-white/5 relative overflow-hidden hidden md:block">
            <div className="absolute bottom-8 w-full text-center font-bold text-xl text-gray-500">Dr. Connors</div>
          </div>
          
          <div className="w-full md:w-1/3 aspect-[9/16] glass-panel border-4 border-white relative overflow-hidden shadow-[0_0_40px_rgba(226,54,54,0.3)] group cursor-pointer transition-transform hover:scale-105">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-red-600 to-transparent opacity-80" />
            <div className="absolute bottom-8 w-full text-center font-black text-3xl text-white">Dr. Octavius</div>
            <div className="absolute top-4 right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">ONLINE</div>
          </div>
          
          <div className="w-1/4 aspect-[9/16] glass-panel opacity-40 scale-90 border border-white/5 relative overflow-hidden hidden md:block">
            <div className="absolute bottom-8 w-full text-center font-bold text-xl text-gray-500">Dr. Strange</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 flex flex-col items-center gap-8 bg-black">
        <h2 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--spidey-red)' }}>
          WEB<span className="text-white">ROUTE</span>
        </h2>
        
        <div className="flex gap-8 text-sm font-bold tracking-widest uppercase text-gray-400">
          <a href="#" className="hover:text-white transition">Home</a>
          <a href="#" className="hover:text-white transition">About us</a>
          <a href="#" className="hover:text-white transition">History</a>
          <a href="#" className="hover:text-white transition">Specialists</a>
        </div>
        
        <p className="text-xs text-gray-600 font-bold tracking-widest mt-4">
          © 2024 WebRoute Triage System | Hackathon Edition
        </p>
      </footer>
    </div>
  );
}
