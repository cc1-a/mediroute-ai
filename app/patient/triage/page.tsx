"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function PatientTriagePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");

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

    const finalSymptoms = needsClarification && !skipFollowUp
      ? `Original: ${symptoms} \n Follow-up Answers: ${answers}`
      : symptoms;

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: finalSymptoms, location,
          skip_followup: skipFollowUp,
          patient_uid: user?.uid || "guest_uid",
          patient_name: user?.name || "Guest"
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit symptoms.");

      if (data.needs_clarification) {
        setNeedsClarification(true);
        setQuestions(data.questions);
      } else {
        setSuccess(true);
        setIsMild(data.isMild);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const s: React.CSSProperties = { fontFamily: 'var(--font-retro)' };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center" style={s}>
      <div className="w-full max-w-2xl flex flex-col gap-0"
        style={{
          backgroundColor: 'var(--bg-panel)',
          padding: '20px',
          boxShadow: '0 -6px 0 var(--bg-panel), 0 6px 0 var(--bg-panel), -6px 0 0 var(--bg-panel), 6px 0 0 var(--bg-panel), 0 -10px 0 var(--black), 0 10px 0 var(--black), -10px 0 0 var(--black), 10px 0 0 var(--black)',
        }}
      >
        {/* Screen Header */}
        <div className="pixel-inset mb-5" style={{ backgroundColor: 'var(--map-bg)', padding: '14px 18px' }}>
          <div style={{ color: 'var(--btn-red)', fontSize: 32, letterSpacing: 5, textShadow: '2px 2px 0 var(--black)' }}>
            [ AI TRIAGE ]
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 2 }}>SMART SYMPTOM ANALYSIS</div>
        </div>

        {success ? (
          /* ─ SUCCESS STATE ─ */
          <div className="flex flex-col gap-4">
            <div
              className="pixel-inset"
              style={{
                backgroundColor: isMild ? 'var(--btn-green)' : 'var(--map-bg)',
                color: isMild ? 'var(--black)' : 'var(--white)',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 50, marginBottom: 10 }}>{isMild ? '✅' : '📋'}</div>
              {isMild ? (
                <>
                  <div style={{ fontSize: 26, letterSpacing: 3, marginBottom: 8 }}>MILD CONDITION DETECTED</div>
                  <div style={{ fontSize: 18, opacity: 0.8, marginBottom: 12 }}>
                    NON-CRITICAL. YOU CAN BOOK AN APPOINTMENT DIRECTLY.
                  </div>
                  <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', color: 'var(--btn-cyan)', padding: '12px', fontSize: 16, letterSpacing: 1, marginBottom: 0 }}>
                    💡 CONSIDER AN ONLINE CONSULTATION TO SAVE TIME!
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 26, letterSpacing: 3, marginBottom: 8 }}>CASE SUBMITTED FOR REVIEW</div>
                  <div style={{ fontSize: 18, opacity: 0.7 }}>AN ADMIN WILL REVIEW YOUR CASE BEFORE BOOKING.</div>
                </>
              )}
            </div>

            <button
              id="find-doctor-result-btn"
              onClick={() => router.push('/patient/dashboard')}
              className="retro-btn retro-btn-red pixel-border retro-btn-full"
            >
              ▶ FIND A DOCTOR
            </button>
          </div>

        ) : needsClarification ? (
          /* ─ FOLLOW-UP QUESTIONS ─ */
          <div className="flex flex-col gap-4">
            <div className="pixel-inset" style={{ backgroundColor: 'var(--map-bg)', padding: '14px 18px' }}>
              <div style={{ color: 'var(--btn-cyan)', fontSize: 20, letterSpacing: 2, marginBottom: 10 }}>OUR AI NEEDS MORE INFO:</div>
              <ul className="flex flex-col gap-2">
                {questions.map((q, i) => (
                  <li key={i} style={{ color: 'var(--white)', fontSize: 19, letterSpacing: 1 }}>
                    <span style={{ color: 'var(--btn-red)' }}>{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>

            <textarea
              value={answers}
              onChange={e => setAnswers(e.target.value)}
              rows={4}
              className="retro-textarea"
              placeholder="PROVIDE YOUR ANSWERS HERE..."
            />

            <div className="flex gap-3">
              <button
                id="submit-followup-btn"
                onClick={e => handleSubmit(e, false)}
                disabled={isSubmitting || !answers}
                className="retro-btn retro-btn-blue pixel-border flex-1"
                style={{ fontSize: 20, color: 'var(--white)', opacity: (!answers || isSubmitting) ? 0.5 : 1 }}
              >
                {isSubmitting ? 'PROCESSING...' : 'SUBMIT ANSWERS'}
              </button>
              <button
                id="skip-followup-btn"
                onClick={e => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="retro-btn retro-btn-panel pixel-border"
                style={{ fontSize: 20 }}
              >
                SKIP
              </button>
            </div>
          </div>

        ) : (
          /* ─ INITIAL FORM ─ */
          <form onSubmit={e => handleSubmit(e, false)} className="flex flex-col gap-4">
            <div>
              <label className="retro-label block mb-1">SYMPTOMS</label>
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                required
                rows={5}
                className="retro-textarea"
                placeholder="E.g. FEELING DIZZY AFTER A SPIDER BITE..."
              />
            </div>

            <div>
              <label className="retro-label block mb-1">ZONE (COLOMBO REGION)</label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
                className="retro-select"
              >
                <option value="" disabled>SELECT YOUR ZONE</option>
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <option key={n} value={`Colombo ${n}`}>COLOMBO {n}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="pixel-border" style={{ backgroundColor: 'var(--btn-red)', color: 'var(--black)', padding: '10px 14px', fontSize: 18 }}>
                !! {error}
              </div>
            )}

            <button
              id="run-triage-btn"
              type="submit"
              disabled={isSubmitting}
              className="retro-btn retro-btn-red pixel-border retro-btn-full"
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? 'ANALYZING WEB...' : '▶ RUN AI TRIAGE'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-5 text-center" style={{ backgroundColor: 'var(--map-bg)', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: '8px 12px', letterSpacing: 1, boxShadow: '0 -4px 0 var(--black), 0 4px 0 var(--black), -4px 0 0 var(--black), 4px 0 0 var(--black)' }}>
          © MEDIROUTE AI · TRIAGE SYSTEM
        </div>
      </div>
    </div>
  );
}
