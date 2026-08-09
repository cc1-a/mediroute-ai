import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { medicalRadarIndex } from '@/lib/pinecone';

async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text
      })
    });
    if (!response.ok) {
      throw new Error('Failed to generate embedding from Ollama');
    }
    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.warn("Local Ollama not reachable (likely on Vercel). Using mock deterministic vector for demo.");
    return new Array(1024).fill(0.1);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_uid, 
      patient_name, 
      symptoms, 
      triage, 
      location,
      assigned_doc_uid,
      appointment_time,
      consultation_type,
      room,
      subDocId
    } = body;

    const ticketsRef = collection(db, 'Tickets');
    const newTicket = {
      patient_uid: patient_uid || "guest_uid",
      patient_name: patient_name || "Demo Patient",
      raw_symptoms: symptoms,
      core_symptoms: triage.core_symptoms,
      urgency_level: triage.urgency_level,
      required_specialty: triage.required_specialty,
      location: location,
      status: "pending_confirmation",
      timestamp: serverTimestamp(),
      assigned_doc_uid: assigned_doc_uid,
      subDocId: subDocId || null,
      appointment_time: appointment_time,
      consultation_type: consultation_type,
      room: room,
      emergency_flag: false
    };

    const docRef = await addDoc(ticketsRef, newTicket);

    // Generate Ollama embedding & Upsert to Pinecone
    if (triage.core_symptoms) {
      const embedding = await getEmbedding(triage.core_symptoms);
      await medicalRadarIndex.upsert({
        records: [{
          id: docRef.id,
          values: embedding,
          metadata: { location, timestamp: Date.now() }
        }]
      });

      // Similarity Search for Outbreak Radar
      const queryResponse = await medicalRadarIndex.query({
        vector: embedding,
        topK: 5,
        filter: { location: { $eq: location } },
        includeMetadata: true,
        includeValues: false
      });

      const matches = queryResponse.matches || [];
      const highSimilarityMatches = matches.filter(match => match.id !== docRef.id && (match.score || 0) > 0.85);

      if (highSimilarityMatches.length >= 3) {
        const alertsRef = collection(db, 'Alerts');
        await addDoc(alertsRef, {
          type: "OUTBREAK_WARNING",
          location,
          related_symptoms: triage.core_symptoms,
          count: highSimilarityMatches.length,
          timestamp: serverTimestamp()
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      ticketId: docRef.id
    }, { status: 200 });

  } catch (error: any) {
    console.error('Book API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
