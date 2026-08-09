import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { triageSummary, providerName, providerSpecialty } = body;

    const systemPrompt = `You are a helpful medical assistant. Explain briefly (1-2 short sentences) why this specific provider/hospital was recommended based on the patient's triage summary.
Keep it simple, empathetic, and direct.`;
    
    const userPrompt = `Triage Summary: ${JSON.stringify(triageSummary)}\nRecommended Provider: ${providerName} (${providerSpecialty})`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.1-8b-instant', // low cost tier
      temperature: 0.3,
    });

    const explanation = chatCompletion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ explanation }, { status: 200 });
  } catch (error: any) {
    console.error('Explain Recommendation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
