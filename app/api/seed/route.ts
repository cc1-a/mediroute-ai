import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

const users = [
  { uid: 'patient_1', role: 'patient', name: 'Peter Parker', location: 'Colombo 1' },
  { uid: 'patient_2', role: 'patient', name: 'Mary Jane', location: 'Colombo 3' },
  { uid: 'patient_3', role: 'patient', name: 'Harry Osborn', location: 'Colombo 5' },
  { uid: 'patient_4', role: 'patient', name: 'Gwen Stacy', location: 'Dehiwala' },
  
  { uid: 'admin_1', role: 'admin', name: 'Nick Fury', location: 'Global' },
  
  { uid: 'doc_hospital_1', role: 'hospital', name: 'Asiri Central', location: 'Colombo 1' },
  { uid: 'doc_hospital_2', role: 'hospital', name: 'Lanka Hospitals', location: 'Colombo 5' },
  
  { uid: 'doc_freelance_1', role: 'doctor', name: 'Dr. Strange', location: 'Colombo 3' },
  { uid: 'doc_freelance_2', role: 'doctor', name: 'Dr. Connors', location: 'Dehiwala' },
  { uid: 'doc_freelance_3', role: 'doctor', name: 'Dr. Octavius', location: 'Colombo 1' },
];

const doctorProfiles = [
  { uid: 'doc_hospital_1', specialty: 'General', available_slots: [{ time: '10:00 AM', duration_mins: 15, booked: false }, { time: '10:15 AM', duration_mins: 15, booked: false }] },
  { uid: 'doc_hospital_2', specialty: 'Cardiology', available_slots: [{ time: '11:00 AM', duration_mins: 30, booked: false }] },
  { uid: 'doc_freelance_1', specialty: 'Neurology', available_slots: [{ time: '09:00 AM', duration_mins: 20, booked: false }] },
  { uid: 'doc_freelance_2', specialty: 'Infectious Disease', available_slots: [{ time: '14:00 PM', duration_mins: 10, booked: false }] },
  { uid: 'doc_freelance_3', specialty: 'General', available_slots: [{ time: '16:00 PM', duration_mins: 15, booked: false }] },
];

const medicalLogs = [
  { log_id: 'log_1', patient_uid: 'patient_1', final_diagnosis: 'Spider Bite Reaction', medicine: 'Rest, fluids', location: 'Colombo 1', timestamp: Date.now() - 86400000 }
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
    
    // Add 1 history log for Patient 1
    for (const l of medicalLogs) {
      await setDoc(doc(logsRef, l.log_id), l);
    }

    return NextResponse.json({ success: true, message: 'Database seeded for Spider-Man theme!' }, { status: 200 });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
