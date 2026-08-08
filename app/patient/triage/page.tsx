"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PatientTriagePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  
  // Follow-up state
  const [needsClarification, setNeedsClarification] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMild, setIsMild] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent, skipFollowUp = false) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    // Combine symptoms and answers if we are answering follow-ups
    const finalSymptoms = needsClarification && !skipFollowUp 
      ? `Original: ${symptoms} \n Follow-up Answers: ${answers}`
      : symptoms;

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          symptoms: finalSymptoms, 
          location,
          skip_followup: skipFollowUp,
          patient_uid: user?.uid || "guest_uid",
          patient_name: user?.name || "Guest"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit symptoms.");
      }

      if (data.needs_clarification) {
        setNeedsClarification(true);
        setQuestions(data.questions);
      } else {
        // Triage is finalized
        setSuccess(true);
        setIsMild(data.isMild);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl glass-panel rounded-2xl shadow-2xl p-8 border border-white/20">
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black mb-2 tracking-tight" style={{ color: 'var(--spidey-red)' }}>AI Triage</h1>
          <p className="text-gray-300 font-medium">Smart Symptom Analysis</p>
        </div>

        {success ? (
          <div className="glass-panel-red rounded-xl p-8 text-center animate-fade-in">
            {isMild ? (
              <>
                <h3 className="text-2xl font-bold mb-4 text-green-400">Mild Condition Detected</h3>
                <p className="text-gray-200 mb-6">Our AI has evaluated your symptoms as non-critical. You have been cleared to directly book an appointment.</p>
                <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl mb-6 text-sm text-blue-200">
                  💡 <strong>Recommendation:</strong> Consider choosing an <span className="text-white font-bold">Online Consultation</span> to save time and travel! Many freelance doctors on our network offer Google Meet appointments.
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-4">Case Submitted for Admin Review</h3>
                <p className="text-gray-200 mb-6">Your symptoms have been logged and will be reviewed by an admin before booking.</p>
              </>
            )}
            
            <button 
              onClick={() => router.push('/patient/dashboard')}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-lg transition shadow-lg shadow-red-500/30"
            >
              Find a Doctor
            </button>
          </div>
        ) : needsClarification ? (
           <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-blue-900/40 border border-blue-500/30 rounded-xl">
                <h3 className="font-bold text-xl mb-4 text-blue-300">Our AI Needs More Info:</h3>
                <ul className="list-disc pl-5 mb-4 text-gray-200 space-y-2">
                  {questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
              
              <textarea
                value={answers}
                onChange={(e) => setAnswers(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white placeholder-gray-400"
                placeholder="Provide your answers here..."
              />

              <div className="flex gap-4">
                <button
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isSubmitting || !answers}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Submit Answers"}
                </button>
                <button
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition"
                >
                  Skip & See General Doc
                </button>
              </div>
           </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                What are your symptoms?
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white placeholder-gray-500"
                placeholder="E.g. Feeling dizzy after a spider bite..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Select Zone (Colombo Region)
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0a192f] border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition text-white"
              >
                <option value="" disabled>Select your zone</option>
                <option value="Colombo 1">Colombo 1</option>
                <option value="Colombo 2">Colombo 2</option>
                <option value="Colombo 3">Colombo 3</option>
                <option value="Colombo 4">Colombo 4</option>
                <option value="Colombo 5">Colombo 5</option>
                <option value="Colombo 6">Colombo 6</option>
                <option value="Colombo 7">Colombo 7</option>
                <option value="Colombo 8">Colombo 8</option>
                <option value="Colombo 9">Colombo 9</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${
                isSubmitting ? "bg-red-500/50 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
              }`}
            >
              {isSubmitting ? "Analyzing Web..." : "Run AI Triage"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
