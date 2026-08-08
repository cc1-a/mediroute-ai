# User Journeys & Workflows (V2)

## A. Intelligent AI Triage & Admin Review (Patient Side)
1. Patient enters symptoms.
2. AI (Groq) evaluates. If vague, AI returns `follow_up_questions`.
3. Patient can answer questions (re-evaluate) or SKIP.
4. If SKIP, ticket is immediately marked for `General Doctor`.
5. Triage is finalized and vector is sent to Pinecone. 
6. Ticket is created with status `pending_admin`.
7. Admin sees the ticket in their queue and can flag it as `EMERGENCY` or `Standard`.
8. Once Admin reviews, ticket status changes to `pending_booking`.

## B. Booking & Availability Flow
1. Doctors/Hospitals log in and set their `available_slots` (e.g., 9:00 AM, 15 mins).
2. After Admin review, Patient sees a list of available Doctors/Hospitals in their Colombo sub-region matching the specialty.
3. Patient selects a time slot and books it (`status -> booked`).
4. Hospitals can handle multiple ticketing lines concurrently.

## C. Doctor Dashboard & Diagnosis
1. Doctor/Hospital sees their booked appointments in real-time.
2. Doctor clicks "Start Consultation".
3. After consultation, Doctor writes `Diagnosis` and `Medicine`.
4. Ticket is finalized and pushed to `MedicalLogs`.

## D. Seeding & Mock Data
- We will seed 4 Patients (1 with history).
- We will seed 1 Admin.
- We will seed 5 Doctors (2 as Big Hospitals, 3 as Freelance).
- Focus is exclusively on Colombo sub-regions (e.g., Colombo 1, Colombo 3, Dehiwala).
