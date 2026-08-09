# Architecture & Rules: Spider-Man Healthcare Triage & Booking

## Roles & Functions
1. **Patients**: Submit symptoms. Vague symptoms trigger AI follow-up questions. Can skip to General Doctor. Can book available slots after triage.
2. **Serving Doctors & Hospitals**: 
   - **Freelance Doctors**: Manage their own availability and queue.
   - **Big Hospitals**: Can have multiple ticketing lines (multiple doctors).
   - Both can specify appointment durations, set available times, write final diagnosis, and prescribe medicine.
3. **Admin (Monitoring)**: Receives every triage submission and flags if it's an emergency. Also monitors global outbreaks.

## UI/UX Guidelines (Spider-Man Redesign)
- Framework: Next.js App Router
- Styling: Tailwind CSS
- Theme: Spider-Man Aesthetic (Vibrant Red `#E23636`, Deep Blue `#0452b4`, dark web-pattern backgrounds, glassmorphism, dynamic superhero micro-animations).
- Experience: Fast, vivid, responsive, premium.

## Database Schema (Firebase Firestore)
- `Users`: `{ uid, role (patient|doctor|hospital|admin), name, location (Colombo sub-parts) }`
- `DoctorProfiles`: 
  - Standalone: `{ uid, specialty, ranges: [{ start, end }] }`
  - Hospital: `{ uid, doctors: [{ id, name, specialty, ranges: [{ start, end }] }] }`
- `Tickets`: `{ ticket_id, patient_uid, patient_name, raw_symptoms, core_symptoms, urgency_level, required_specialty, location, status (pending_confirmation|pending_admin|pending_booking|booked|completed), assigned_doc_uid, subDocId (if hospital), appointment_time, emergency_flag, timestamp }`
- `MedicalLogs`: `{ log_id, ticket_id, patient_uid, patient_name, final_diagnosis, medicine, location, timestamp }`

## Pinecone (Vector Database)
- Index Name: `medical-radar` (1024 dimensions)
- Vectors: Embedded text of patient symptoms.
