import { NextRequest, NextResponse } from 'next/server';
import { GmailService } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

// Mock data for fallback
const mockEmails = [
  {
    id: 'mock-1',
    subject: 'Welcome to Your Dashboard',
    from: 'welcome@example.com',
    snippet: 'Thank you for joining our platform. Here\'s how to get started...',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
    importance: 'high' as const,
    labels: ['INBOX', 'IMPORTANT'],
  },
  {
    id: 'mock-2',
    subject: 'Weekly Team Meeting',
    from: 'team@company.com',
    snippet: 'Don\'t forget about our weekly team meeting scheduled for tomorrow...',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    importance: 'medium' as const,
    labels: ['INBOX'],
  },
  {
    id: 'mock-3',
    subject: 'Newsletter: Latest Updates',
    from: 'newsletter@updates.com',
    snippet: 'Check out the latest features and improvements in this month\'s update...',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isRead: true,
    importance: 'low' as const,
    labels: ['INBOX'],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    
    console.log('Gmail API route called with maxResults:', maxResults);
    
    // Check if Gmail credentials are available
    const hasCredentials = !!(
      process.env.GMAIL_CLIENT_ID && 
      process.env.GMAIL_CLIENT_SECRET && 
      process.env.GMAIL_REFRESH_TOKEN
    );

    if (!hasCredentials) {
      console.log('Gmail credentials not configured, using mock data');
      return NextResponse.json({
        emails: mockEmails.slice(0, Math.min(maxResults, mockEmails.length)),
        message: 'Gmail API credentials not configured - showing sample data. Please configure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in your environment variables.',
        usingMockData: true,
        reason: 'missing_credentials'
      });
    }
    
    // Log credential status for debugging
    console.log('Gmail credentials check:', {
      hasClientId: !!process.env.GMAIL_CLIENT_ID,
      hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
      hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN,
      clientIdLength: process.env.GMAIL_CLIENT_ID?.length || 0,
      refreshTokenLength: process.env.GMAIL_REFRESH_TOKEN?.length || 0,
      clientIdPreview: process.env.GMAIL_CLIENT_ID?.substring(0, 30) + '...',
      clientIdValid: process.env.GMAIL_CLIENT_ID?.includes('.apps.googleusercontent.com'),
      refreshTokenValid: process.env.GMAIL_REFRESH_TOKEN?.startsWith('1//')
    });
    
    console.log('Attempting to fetch Gmail emails...');
    
    try {
      const gmailService = new GmailService();
      const emails = await gmailService.getEmails(maxResults);
      
      console.log('Successfully fetched emails from Gmail API:', emails.length);
      
      return NextResponse.json({
        emails,
        message: `Successfully fetched ${emails.length} emails from Gmail`,
        usingMockData: false
      });
    } catch (gmailError: any) {
      console.error('Gmail API Error:', {
        message: gmailError.message,
        code: gmailError.code,
        status: gmailError.status
      });
      
      console.error('Gmail API failed:', gmailError.message);
      
      // Return error details for debugging
      return NextResponse.json({
        emails: [],
        message: `Gmail API error: ${gmailError.message}`,
        usingMockData: false,
        error: gmailError.message
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in Gmail API route:', error);
    
    return NextResponse.json({
      emails: [],
      message: 'Unexpected error occurred.',
      usingMockData: false,
      error: error.message
    }, { status: 500 });
  }
}