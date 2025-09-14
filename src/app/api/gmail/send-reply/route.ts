import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const { emailId, to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const gmailService = new GmailService();
    const result = await gmailService.sendReply(emailId, to, subject, body);

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error: any) {
    console.error('Gmail Send Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}