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
      triageData = {
        core_symptoms: symptoms,
        suspected_condition: "Unknown",
        urgency_level: 3,
        required_specialty: "General Practitioner",
        estimated_duration_mins: 15
      };
    } else {
      const systemPrompt = `You are an expert AI triage assistant. Evaluate the patient's symptoms.
If the symptoms are too vague to determine a specialty or urgency, set "needs_clarification" to true and provide up to 2 "follow_up_questions".
If the symptoms are clear enough, set "needs_clarification" to false, and provide:
- "core_symptoms": A concise summary.
- "suspected_condition": Suspected condition or category.
- "urgency_level": An integer from 1 to 5 (1 being lowest, 5 being highest).
- "required_specialty": The required medical specialty.
- "estimated_duration_mins": AI estimated appointment duration in minutes (e.g. 15, 30, 45, 60).

Return ONLY a strict JSON object with these fields, with no markdown formatting.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: symptoms }
        ],
        model: 'llama-3.1-8b-instant', // "Use a small, low-cost/fast model (not the main conversational model) to classify severity and required specialty from the triage summary." (Wait, for conversational, let's use a better model? The instructions say "recommendation classification ... should all run on a cheap/fast model tier". I'll use 8b-instant which is fast).
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      const aiResponse = chatCompletion.choices[0]?.message?.content;
      if (!aiResponse) throw new Error('Failed to parse AI response');
      triageData = JSON.parse(aiResponse);

      if (triageData.needs_clarification) {
        return NextResponse.json({ 
          needs_clarification: true, 
          questions: triageData.follow_up_questions 
        }, { status: 200 });
      }
    }

    const isMild = triageData.urgency_level <= 2;
    const initialStatus = isMild ? "pending_booking" : "pending_admin";

    // Return without committing to DB
    return NextResponse.json({ 
      success: true, 
      triage: triageData,
      status: initialStatus,
      isMild
    }, { status: 200 });

  } catch (error: any) {
    console.error('Triage API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
