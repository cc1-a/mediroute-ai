# MediRoute AI — Smart Triage & Epidemiological Vector Radar 🏥

![MediRoute AI Banner](https://via.placeholder.com/1200x400/0f172a/38bdf8?text=MediRoute+AI+-+Smart+Healthcare+Triage)

> **Target SDG:** Goal 3: Good Health and Well-Being

**MediRoute AI** is a real-time triage platform powered by Groq LLM inference and Pinecone vector similarity search. It parses patient natural language symptoms, routes prioritized tickets to available specialty doctors, and detects localized disease clusters in real-time before they escalate into health crises.

---

## 🚀 The Problem
Sri Lankan healthcare institutions suffer from slow manual intake, lack of automated priority routing, and delayed detection of regional viral outbreaks. Hospitals often face bottlenecks that slow down emergency responses, while epidemiological data is analyzed too late.

## 💡 The Solution
MediRoute AI solves this using a real-time AI triage and vector-based epidemiological radar:
1. **Intelligent Triage:** Patients submit raw, natural language symptoms. A Groq-powered LLM instantly parses the text, calculates clinical urgency, and assigns a required specialty.
2. **Real-Time Doctor Queue:** Doctors receive prioritized patient tickets in a live, color-coded Kanban dashboard via Firebase Firestore, allowing them to treat high-risk patients immediately.
3. **Outbreak Radar:** Symptom summaries are converted into high-dimensional vector embeddings and queried against a Pinecone Vector Database. If a high-similarity cluster occurs in a specific geographic region (e.g., Colombo), our Admin Radar triggers a real-time localized outbreak warning.

---

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI / LLM:** Groq API (`llama3-8b-8192`) for instantaneous JSON symptom extraction
- **Vector Database:** Pinecone (Vector Similarity Search)
- **Embeddings:** Local Ollama (`nomic-embed-text`)
- **Real-Time Database:** Firebase Firestore

---

## ⚙️ Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mediroute-ai.git
cd mediroute-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🗺️ System Architecture (The Documentation Loop)
Check out our core documentation files to understand the system architecture in-depth:
- [`structure.md`](./structure.md) - Absolute rules, UI/UX, and core logic.
- [`workflows.md`](./workflows.md) - Step-by-step logic for user journeys.
- [`filestructure.md`](./filestructure.md) - Directory tree and mapping.
- [`logs.md`](./logs.md) - Development history.

---

## 🏆 Hackathon Submission Details
- **Phase:** 1 Evaluation
- **Demo Video:** [Insert YouTube/Loom Link Here]
- **Live Prototype:** [Insert Vercel Link Here]
