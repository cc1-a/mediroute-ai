# File Structure Mapping

```
/
├── app/
│   ├── page.tsx                 # Spider-Man Landing/Auth Page
│   ├── layout.tsx               # Root layout with Spider-Man global CSS
│   ├── globals.css              # Spider-Man Theme tokens & Web patterns
│   ├── api/
│   │   ├── triage/route.ts      # AI Triage & Clarification logic
│   │   └── seed/route.ts        # Database seeder endpoint
│   ├── patient/
│   │   ├── triage/page.tsx      # Triage Input & Follow-up Questions UI
│   │   └── booking/page.tsx     # Hospital/Doctor Slot Selection UI
│   ├── doctor/
│   │   ├── dashboard/page.tsx   # Doctor Queue, Diagnosis & Medicine UI
│   │   └── schedule/page.tsx    # Doctor Slot Management UI
│   └── admin/
│       ├── radar/page.tsx       # Outbreak Radar
│       └── queue/page.tsx       # Admin Emergency Approval Queue
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   └── pinecone.ts              # Pinecone client initialization
├── structure.md
├── filestructure.md
├── workflows.md
└── logs.md
```
