# File Structure Mapping

```
/
├── app/
│   ├── page.tsx               # Landing/Auth Page
│   ├── layout.tsx             # Root layout
│   ├── api/
│   │   └── triage/
│   │       └── route.ts       # Triage API (Groq & Firestore)
│   ├── patient/
│   │   └── triage/
│   │       └── page.tsx       # Patient Triage Interface
│   ├── doctor/
│   │   └── dashboard/
│   │       └── page.tsx       # Doctor Dashboard Interface
│   └── admin/
│       └── radar/
│           └── page.tsx       # Admin Radar Interface
├── lib/
│   ├── firebase.ts            # Firebase initialization
│   └── pinecone.ts            # Pinecone client initialization
├── structure.md               # Absolute rules, UI/UX, core logic
├── filestructure.md           # Exact directory tree and mapping
├── workflows.md               # Step-by-step logic for user journeys
└── logs.md                    # History of built items and bugs/todos
```
