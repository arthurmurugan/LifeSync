import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  let requestData: any;
  
  try {
    requestData = await request.json();
    const { subject, from, body, regenerate } = requestData;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes emails and generates contextual smart replies. 

          Analyze the email content and respond with a JSON object containing:
          - reply: a single, contextually appropriate reply based on the email content (not an array)
          - tone: detected tone (professional, casual, urgent, friendly, formal)
          - isEvent: boolean (true if contains meeting/appointment/deadline/event)
          - eventDetails: if isEvent is true, extract {title, date, time, location} from email content
          - hasDeadline: boolean (true if email mentions a deadline or due date)
          - deadline: if hasDeadline is true, extract the deadline date in YYYY-MM-DD format
          - taskSuggestion: specific task title based on email content
          - priority: suggested priority level (high, medium, low) based on urgency and content
          - category: email category (meeting, deadline, question, request, information, social)

          For the reply:
          - Make it specific to the email content, not generic
          - Consider the sender's tone and formality level
          - Address specific points mentioned in the email
          - Include relevant details from the original message
          - Keep it concise but complete (2-4 sentences)
          - Match the appropriate tone for the context

          ${regenerate ? 'Generate a different reply variation while maintaining the same context and tone.' : ''}

          Only respond with valid JSON, no other text.`
        },
        {
          role: "user",
          content: `Subject: ${subject}\\nFrom: ${from}\\nBody: ${body}`
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: regenerate ? 0.9 : 0.7,
      max_tokens: 1000,
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return NextResponse.json({ analysis });
  } catch (error: any) {
    // Use the already parsed request data for fallback
    const { subject = 'No Subject', from = 'Unknown', body = '', regenerate = false } = requestData || {};
    const emailContent = `${subject} ${body}`.toLowerCase();
    
    const isDeadline = emailContent.includes('deadline') || emailContent.includes('due') || 
                      emailContent.includes('urgent') || emailContent.includes('asap');
    const isMeeting = emailContent.includes('meeting') || emailContent.includes('appointment') || 
                     emailContent.includes('call') || emailContent.includes('conference');
    const isQuestion = emailContent.includes('?') || emailContent.includes('question') || 
                      emailContent.includes('help') || emailContent.includes('clarify');
    const isSocial = emailContent.includes('dinner') || emailContent.includes('party') || 
                    emailContent.includes('birthday') || emailContent.includes('celebration');

    let category = 'information';
    let priority = 'medium';
    let taskSuggestion = `Follow up on: ${subject}`;
    let reply = "Thank you for your email. I'll review this and get back to you soon.";
    
    if (isDeadline) {
      category = 'deadline';
      priority = 'high';
      taskSuggestion = `Complete: ${subject}`;
      reply = "I understand the urgency of this request. I'll prioritize this and ensure it's completed by the deadline. Thank you for the clear timeline.";
    } else if (isMeeting) {
      category = 'meeting';
      priority = 'medium';
      taskSuggestion = `Prepare for: ${subject}`;
      reply = "Thank you for the meeting invitation. I'll check my calendar and confirm my availability shortly. Looking forward to our discussion.";
    } else if (isQuestion) {
      category = 'question';
      priority = 'medium';
      taskSuggestion = `Respond to: ${subject}`;
      reply = "Thank you for your question. I'll look into this thoroughly and provide you with a comprehensive response within the next day.";
    } else if (isSocial) {
      category = 'social';
      priority = 'low';
      taskSuggestion = `RSVP for: ${subject}`;
      reply = "Thanks for the invitation! I appreciate you thinking of me. I'll check my schedule and let you know my availability soon.";
    }

    // Add variation for regeneration
    if (regenerate) {
      const variations = {
        deadline: [
          "I acknowledge the deadline and will make this a top priority. I'll ensure everything is completed on time.",
          "Thank you for the deadline reminder. I'm already working on this and will deliver it as requested.",
          "I understand the time sensitivity. I'll focus on this immediately and keep you updated on progress."
        ],
        meeting: [
          "I've received your meeting request. Let me review my calendar and respond with my availability.",
          "Thank you for scheduling this. I'll confirm my attendance and prepare for our discussion.",
          "I appreciate the meeting invitation. I'll check my schedule and get back to you with confirmation."
        ],
        question: [
          "Great question! I'll research this thoroughly and provide you with detailed information.",
          "Thank you for reaching out. I'll investigate this and respond with comprehensive details.",
          "I'll look into this right away and provide you with the information you need."
        ],
        social: [
          "What a lovely invitation! I'll check my calendar and let you know if I can join.",
          "Thank you for including me! I'll review my schedule and respond with my availability.",
          "I'm honored by the invitation. Let me confirm my availability and get back to you."
        ]
      };
      
      const categoryVariations = variations[category as keyof typeof variations];
      if (categoryVariations) {
        reply = categoryVariations[Math.floor(Math.random() * categoryVariations.length)];
      }
    }

    const fallbackAnalysis = {
      reply,
      tone: from.includes('@company.com') ? 'professional' : 'friendly',
      isEvent: isMeeting || isSocial,
      eventDetails: (isMeeting || isSocial) ? {
        title: subject,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00',
        location: 'TBD'
      } : null,
      hasDeadline: isDeadline,
      deadline: isDeadline ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      taskSuggestion,
      priority,
      category
    };
    
    return NextResponse.json({ analysis: fallbackAnalysis });
  }
}