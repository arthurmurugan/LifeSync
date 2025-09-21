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
    
    // Check if Gmail credentials are available
    const hasCredentials = !!(
      process.env.GMAIL_CLIENT_ID && 
      process.env.GMAIL_CLIENT_SECRET && 
      process.env.GMAIL_REFRESH_TOKEN
    );

    if (!hasCredentials) {
      return NextResponse.json({
        emails: mockEmails.slice(0, Math.min(maxResults, mockEmails.length)),
        message: 'Gmail API credentials not configured - showing sample data.',
        usingMockData: true,
        reason: 'missing_credentials'
      });
    }
    
    try {
      const gmailService = new GmailService();
      const emails = await gmailService.getEmails(maxResults);
      
      return NextResponse.json({
        emails,
        message: `Successfully fetched ${emails.length} emails from Gmail`,
        usingMockData: false
      });
    } catch (gmailError: any) {
      // Silently fall back to mock data
      return NextResponse.json({
        emails: mockEmails.slice(0, Math.min(maxResults, mockEmails.length)),
        message: 'Using sample data due to API limitations',
        usingMockData: true,
        reason: 'api_error'
      });
    }
  } catch (error: any) {
    // Fallback to mock data on any error
    return NextResponse.json({
      emails: mockEmails.slice(0, 12),
      message: 'Using sample data',
      usingMockData: true,
      reason: 'fallback'
    });
  }
}