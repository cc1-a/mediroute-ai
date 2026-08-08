import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
      <main className="max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-blue-900 sm:text-6xl">
            MediRoute AI
          </h1>
          <p className="text-xl text-blue-700 font-medium">
            Smart Healthcare Triage & Ticketing
          </p>
          <p className="text-gray-500 max-w-xl mx-auto">
            Experience real-time, AI-driven healthcare routing. Seamlessly managing patient triage, intelligent ticketing, and epidemiological pattern detection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Link 
            href="/patient/triage" 
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2"
          >
            Demo: Enter as Patient
          </Link>
          <Link 
            href="/doctor/dashboard" 
            className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2"
          >
            Demo: Enter as Doctor
          </Link>
          <Link 
            href="/admin/radar" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-lg flex items-center justify-center gap-2"
          >
            Demo: Enter as Admin
          </Link>
        </div>
      </main>
      
      <footer className="mt-24 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} MediRoute AI Hackathon Submission
      </footer>
    </div>
  );
}
