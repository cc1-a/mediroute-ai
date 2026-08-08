# User Journeys & Workflows

## A. Ticketing & AI Triage Loop (Patient Side)
1. Patient logs in and enters natural language symptoms.
2. Form posts to `/api/triage` with `symptoms` and `location`.
3. API calls Groq LLM (`llama3-8b-8192`) to extract: `core_symptoms`, `urgency_level (1-5)`, `required_specialty` as JSON.
4. API saves parsed ticket data to Firestore `Tickets` collection with `status: pending`.
5. API requests an embedding for `core_symptoms` from local Ollama model (`nomic-embed-text`).
6. API upserts the generated vector to Pinecone `medical-radar` index with patient `location` and `timestamp`.
7. API immediately queries Pinecone for top 5 matches with the same location. Trigger "Outbreak Warning" in Firestore `Alerts` collection if >= 3 matches with score > 0.85 are found.

## B. Doctor Dashboard (Real-Time Ticketing)
1. Doctor opens dashboard; UI listens to real-time Firestore updates for `Tickets` where `status == "pending"`.
2. Doctor reviews AI triage summary, urgency level, and location via the Kanban/data view.
3. Doctor clicks "Accept Ticket" (`status -> accepted`), removing it from the pending queue.
4. Doctor conducts consultation (or telehealth for low urgency).
5. Doctor clicks "Complete", finalizing into `MedicalLogs`.

## C. Admin Outbreak Radar (Real-Time Monitoring)
1. Admin opens radar; UI listens to real-time Firestore updates for `Alerts` collection.
2. The grid dynamically highlights locations actively experiencing anomalous symptom clusters.
3. The live feed scrolls through detected outbreaks and corresponding case counts.
