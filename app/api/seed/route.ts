import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const users = [
  { uid: 'patient1', username: 'patient1', role: 'patient', name: 'Peter Parker', location: 'Colombo 1' },
  { uid: 'patient2', username: 'patient2', role: 'patient', name: 'Mary Jane', location: 'Colombo 3' },
  { uid: 'patient3', username: 'patient3', role: 'patient', name: 'Harry Osborn', location: 'Colombo 5' },
  { uid: 'patient4', username: 'patient4', role: 'patient', name: 'Gwen Stacy', location: 'Colombo 8' },
  
  { uid: 'admin', username: 'admin', role: 'admin', name: 'Nick Fury', location: 'Global' },
  
  // 5 Doctors / Hospitals
  { uid: 'hospital1', username: 'hospital1', role: 'hospital', name: 'Asiri Central', location: 'Colombo 2' },
  { uid: 'hospital2', username: 'hospital2', role: 'hospital', name: 'Lanka Hospitals', location: 'Colombo 5' },
  { uid: 'doctor1', username: 'doctor1', role: 'doctor', name: 'Dr. Strange', location: 'Colombo 3' },
  { uid: 'doctor2', username: 'doctor2', role: 'doctor', name: 'Dr. Connors', location: 'Colombo 9' },
  { uid: 'doctor3', username: 'doctor3', role: 'doctor', name: 'Dr. Octavius (Online Consult)', location: 'Colombo 1', isOnline: true },
];

const doctorProfiles = [
  { 
    uid: 'hospital1', 
    doctors: [
      { id: 'doc_1', name: 'Dr. Reed Richards', specialty: 'General Practitioner', ranges: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
      { id: 'doc_2', name: 'Dr. Susan Storm', specialty: 'Neurology', ranges: [{ start: '09:00', end: '15:00' }] }
    ]
  },
  { 
    uid: 'hospital2', 
    doctors: [
      { id: 'doc_3', name: 'Dr. Bruce Banner', specialty: 'Cardiology', ranges: [{ start: '10:00', end: '16:00' }] },
      { id: 'doc_4', name: 'Dr. Tony Stark', specialty: 'Orthopedics', ranges: [{ start: '14:00', end: '20:00' }] }
    ]
  },
  { 
    uid: 'doctor1', 
    specialty: 'Neurology', 
    ranges: [{ start: '09:00', end: '14:00' }] 
  },
  { 
    uid: 'doctor2', 
    specialty: 'Infectious Disease', 
    ranges: [{ start: '10:00', end: '18:00' }] 
  },
  { 
    uid: 'doctor3', 
    specialty: 'General Practitioner', 
    ranges: [{ start: '16:00', end: '22:00' }], 
    isOnline: true, 
    meetLink: 'https://meet.google.com/abc-xyz-123' 
  },
];

const medicalLogs = [
  { log_id: 'log_1', patient_uid: 'patient1', final_diagnosis: 'Spider Bite Reaction', medicine: 'Rest, fluids', location: 'Colombo 1', timestamp: Date.now() - 86400000 },
  { log_id: 'log_2', patient_uid: 'patient2', final_diagnosis: 'Mild concussion', medicine: 'Rest', location: 'Colombo 3', timestamp: Date.now() - (86400000 * 2) },
];

export async function GET() {
  try {
    const usersRef = collection(db, 'Users');
    const doctorProfilesRef = collection(db, 'DoctorProfiles');
    const logsRef = collection(db, 'MedicalLogs');

    // Add Users
    for (const u of users) {
      await setDoc(doc(usersRef, u.uid), u);
    }

    // Add Doctor Profiles
    for (const dp of doctorProfiles) {
      await setDoc(doc(doctorProfilesRef, dp.uid), dp);
    }
    
    // Add History logs
    for (const l of medicalLogs) {
      await setDoc(doc(logsRef, l.log_id), l);
    }

    return NextResponse.json({ success: true, message: 'Database seeded for Spider-Man theme with usernames!' }, { status: 200 });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
