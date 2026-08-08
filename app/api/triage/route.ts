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
    // Return a mock 1024-dimensional vector to match the Pinecone index dimension size.
    return new Array(1024).fill(0.1);
  }
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symptoms, location } = body;

    if (!symptoms || !location) {
      return NextResponse.json({ error: 'Symptoms and location are required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert AI triage assistant. Extract the following information from the patient's symptoms into a strict JSON object:
- "core_symptoms": A concise summary of the main symptoms.
- "urgency_level": An integer from 1 to 5 (1 being lowest, 5 being highest).
- "required_specialty": The medical specialty required (e.g., General, Dermatology, Cardiology, Neurology, etc.).

Return ONLY the JSON object, with no markdown formatting or other text.`;

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
    
    if (!aiResponse) {
      throw new Error('Failed to parse AI response');
    }

    const triageData = JSON.parse(aiResponse);

    // Save to Firestore
    const ticketsRef = collection(db, 'Tickets');
    const newTicket = {
      patient_name: "Demo Patient",
      raw_symptoms: symptoms,
      core_symptoms: triageData.core_symptoms,
      urgency_level: triageData.urgency_level,
      required_specialty: triageData.required_specialty,
      location: location,
      status: "pending",
      timestamp: serverTimestamp(),
      assigned_doc_uid: null
    };

    const docRef = await addDoc(ticketsRef, newTicket);

    // Generate Ollama embedding
    const embedding = await getEmbedding(triageData.core_symptoms);

    // Upsert to Pinecone
    await medicalRadarIndex.upsert({
      records: [{
        id: docRef.id,
        values: embedding,
        metadata: { location, timestamp: Date.now() }
      }]
    });

    // Similarity Search (The Radar)
    const queryResponse = await medicalRadarIndex.query({
      vector: embedding,
      topK: 5,
      filter: { location: { $eq: location } },
      includeMetadata: true,
      includeValues: false
    });

    // Trigger Outbreak Alert
    const matches = queryResponse.matches || [];
    // Count matches excluding the one just inserted, with score > 0.85
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

    return NextResponse.json({ success: true, ticketId: docRef.id, triage: triageData }, { status: 200 });

  } catch (error: any) {
    console.error('Triage API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
