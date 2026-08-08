import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
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

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symptoms, location, skip_followup, patient_uid, patient_name } = body;

    if (!symptoms || !location) {
      return NextResponse.json({ error: 'Symptoms and location are required' }, { status: 400 });
    }

    let triageData: any = {};

    if (skip_followup) {
      // Patient skipped follow-up questions
      triageData = {
        core_symptoms: symptoms,
        urgency_level: 3,
        required_specialty: "General"
      };
    } else {
      const systemPrompt = `You are an expert AI triage assistant. Evaluate the patient's symptoms.
If the symptoms are too vague to determine a specialty or urgency, set "needs_clarification" to true and provide up to 2 "follow_up_questions".
If the symptoms are clear enough, set "needs_clarification" to false, and provide:
- "core_symptoms": A concise summary.
- "urgency_level": An integer from 1 to 5 (1 being lowest, 5 being highest).
- "required_specialty": The required medical specialty.

Return ONLY a strict JSON object with these fields, with no markdown formatting.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: symptoms }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content;
      if (!aiResponse) throw new Error('Failed to parse AI response');
      triageData = JSON.parse(aiResponse);

      if (triageData.needs_clarification) {
        // Stop here and ask frontend to show questions
        return NextResponse.json({ 
          needs_clarification: true, 
          questions: triageData.follow_up_questions 
        }, { status: 200 });
      }
    }

    const isMild = triageData.urgency_level <= 2;
    const initialStatus = isMild ? "pending_booking" : "pending_admin";

    // Triage is finalized. Save to Firestore
    const ticketsRef = collection(db, 'Tickets');
    const newTicket = {
      patient_uid: patient_uid || "guest_uid",
      patient_name: patient_name || "Demo Patient",
      raw_symptoms: symptoms,
      core_symptoms: triageData.core_symptoms,
      urgency_level: triageData.urgency_level,
      required_specialty: triageData.required_specialty,
      location: location,
      status: initialStatus,
      timestamp: serverTimestamp(),
      assigned_doc_uid: null,
      emergency_flag: false
    };

    const docRef = await addDoc(ticketsRef, newTicket);

    // Generate Ollama embedding & Upsert to Pinecone
    const embedding = await getEmbedding(triageData.core_symptoms);
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
        related_symptoms: triageData.core_symptoms,
        count: highSimilarityMatches.length,
        timestamp: serverTimestamp()
      });
    }

    return NextResponse.json({ 
      success: true, 
      ticketId: docRef.id, 
      triage: triageData,
      status: initialStatus,
      isMild
    }, { status: 200 });

  } catch (error: any) {
    console.error('Triage API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
