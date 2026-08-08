# Architecture & Rules: Smart Healthcare Triage & Ticketing

## Roles & Functions
1. **Patients**: Submit natural language symptoms -> AI triage -> Ticketing.
2. **Serving Doctors**: Register by Specialty, Location, Capacity. Dashboard for accepting tickets and managing logs.
3. **Admin (Monitoring)**: Real-time global dashboard observing anomaly detection.

## UI/UX Guidelines
- Framework: Next.js App Router
- Styling: Tailwind CSS
- Theme: Clean, modern, medical-themed (MediRoute AI - Smart Triage).
- Loading States: Robust error handling, spinners, skeletons for all async actions.

## Database Schema
### Firebase Firestore (NoSQL)
- `Users`: `{ uid, role, name, specialty, location, is_available }`
- `Tickets`: `{ ticket_id, patient_uid, patient_name, raw_symptoms, assigned_doc_uid, status, urgency_level, timestamp }`
- `MedicalLogs`: `{ log_id, patient_uid, final_diagnosis, embedded_text, location, timestamp }`

### Pinecone (Vector Database)
- Index Name: `medical-radar`
- Vectors: Embedded text of patient symptoms.
- Metadata: `timestamp`, `location`, `urgency_level`.

## Code Guidelines
- Firebase/Pinecone calls must be abstracted into dedicated utility functions inside `/lib` or `/services`.
- Ensure all API keys securely use `.env.local` or `.env`.
