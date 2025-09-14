import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { subject, from, body } = await request.json();

    if (!subject || !from || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, from, body' },
        { status: 400 }
      );
    }

    const prompt = `You are an AI assistant helping to generate professional email replies. 

Original email details:
- From: ${from}
- Subject: ${subject}
- Body: ${body}

Please generate a professional, helpful, and contextually appropriate reply to this email. The reply should:
1. Be polite and professional
2. Address the main points from the original email
3. Be concise but complete
4. Use appropriate business email tone
5. Include a proper greeting and closing

Generate only the email body content, no subject line or headers.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('No reply generated from Groq AI');
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI reply' },
      { status: 500 }
    );
  }
}