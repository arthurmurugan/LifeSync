import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    const gmailService = new GmailService();
    const email = await gmailService.getEmailDetails(emailId);

    return NextResponse.json({ email });
  } catch (error: any) {
    console.error('Gmail API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email details' },
      { status: 500 }
    );
  }
}