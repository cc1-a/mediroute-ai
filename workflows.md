# User Journeys & Workflows (V2)

## A. Intelligent AI Triage (Patient Side)
1. Patient clicks "Find Doctor" and enters symptoms.
2. AI (Groq) evaluates. If vague, AI asks `follow_up_questions` incrementally.
3. Triage progress is saved to a persistent browser Cookie, allowing patients to resume without losing state.
4. Once AI is confident, it produces a structured summary (core symptoms, urgency, required specialty).

## B. Doctor Search & Dynamic Booking
1. Patient selects their location (e.g. "Colombo 1").
2. The UI fetches all doctors and hospitals, sorting them by `Nearby` and `Online`.
3. AI generates custom explanations for "Recommended" doctors, toggleable on their card.
4. Patient clicks "View Timetable & Book" on a specific doctor.
5. Patient picks a date. System dynamically slices the doctor's set `ranges` by the estimated appointment duration to generate selectable slots.
6. System checks Firestore to prevent double-booking. If successful, creates ticket (`status -> pending_confirmation`).

## C. Doctor Dashboard & Diagnosis
1. Doctors/Hospitals log into their dashboard to manage `QUEUE` and `SCHEDULE`.
2. In `SCHEDULE`, Hospitals can add sub-doctors and time ranges. Freelance docs just manage their own ranges.
3. In `QUEUE`, they can see and confirm pending bookings.
4. During consultation, Doctor writes `Diagnosis` and `Medicine`, finalizing the ticket to `MedicalLogs`.

## D. Seeding & Mock Data
- We will seed 4 Patients (1 with history).
- We will seed 1 Admin.
- We will seed 5 Doctors (2 as Big Hospitals, 3 as Freelance).
- Focus is exclusively on Colombo sub-regions (e.g., Colombo 1, Colombo 3, Dehiwala).
