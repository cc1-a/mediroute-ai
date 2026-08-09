# File Structure Mapping

```
/
├── app/
│   ├── page.tsx                 # Spider-Man Landing/Auth Page
│   ├── layout.tsx               # Root layout with Spider-Man global CSS
│   ├── globals.css              # Spider-Man Theme tokens & Web patterns
│   ├── api/
│   │   ├── triage/route.ts      # AI Triage & Clarification logic
│   │   ├── book/route.ts        # Booking & Double-booking validation logic
│   │   ├── explain-recommendation/route.ts # AI Recommendation explainer
│   │   └── seed/route.ts        # Database seeder endpoint
│   ├── patient/
│   │   ├── triage/page.tsx      # Legacy Triage Input UI
│   │   ├── dashboard/page.tsx   # Triage, Location, Booking & Timetable UI
│   │   └── booking/page.tsx     # Legacy Booking UI
│   ├── doctor/
│   │   └── dashboard/page.tsx   # Doctor Queue, Schedule Manager & Ranges UI
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
