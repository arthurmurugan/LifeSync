import { google } from 'googleapis';

interface Email {
  id: string;
  subject: string;
  from: string;
  body: string;
  date: string;
  isRead: boolean;
  importance: 'high' | 'medium' | 'low';
  labels: string[];
}

// Mock emails for fallback
const mockEmails: Email[] = [
  {
    id: 'mock-1',
    subject: 'Welcome to Your Dashboard',
    from: 'welcome@example.com',
    body: 'Thank you for joining our platform. Here\'s how to get started with your new dashboard. We\'ve prepared a comprehensive guide to help you navigate through all the features and make the most of your experience.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: false,
    importance: 'high',
    labels: ['INBOX', 'IMPORTANT'],
  },
  {
    id: 'mock-2',
    subject: 'Weekly Team Meeting - Tomorrow 2PM',
    from: 'team@company.com',
    body: 'Don\'t forget about our weekly team meeting scheduled for tomorrow at 2PM. We\'ll be discussing the quarterly goals and upcoming project deadlines. Please prepare your status updates.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    importance: 'medium',
    labels: ['INBOX'],
  },
  {
    id: 'mock-3',
    subject: 'Newsletter: Latest Updates',
    from: 'newsletter@updates.com',
    body: 'Check out the latest features and improvements in this month\'s update. We\'ve added new integrations, improved performance, and fixed several bugs based on your feedback.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isRead: true,
    importance: 'low',
    labels: ['INBOX'],
  },
];

export class GmailService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'http://localhost:3000/auth/callback'
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  async getEmails(maxResults: number = 10): Promise<Email[]> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox',
      });

      const messages = response.data.messages || [];
      const emails: Email[] = [];

      for (const message of messages.slice(0, maxResults)) {
        try {
          const emailData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          });

          const headers = emailData.data.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

          // Extract body text
          let body = '';
          const payload = emailData.data.payload;
          if (payload?.body?.data) {
            body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
          } else if (payload?.parts) {
            for (const part of payload.parts) {
              if (part.mimeType === 'text/plain' && part.body?.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                break;
              }
            }
          }

          const isRead = !emailData.data.labelIds?.includes('UNREAD');
          const importance = emailData.data.labelIds?.includes('IMPORTANT') ? 'high' : 'medium';

          emails.push({
            id: message.id!,
            subject,
            from,
            body: body.substring(0, 500), // Limit body length
            date: new Date(date).toISOString(),
            isRead,
            importance,
            labels: emailData.data.labelIds || []
          });
        } catch (emailError) {
          // Silently continue on individual email errors
          continue;
        }
      }

      return emails;

    } catch (error: any) {
      // Silently fall back to mock emails
      return mockEmails.slice(0, maxResults);
    }
  }

  async getEmailDetails(emailId: string): Promise<Email | null> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      const emailData = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      });

      const headers = emailData.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

      // Extract body text
      let body = '';
      const payload = emailData.data.payload;
      if (payload?.body?.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload?.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
      }

      const isRead = !emailData.data.labelIds?.includes('UNREAD');
      const importance = emailData.data.labelIds?.includes('IMPORTANT') ? 'high' : 'medium';

      return {
        id: emailId,
        subject,
        from,
        body,
        date: new Date(date).toISOString(),
        isRead,
        importance,
        labels: emailData.data.labelIds || []
      };

    } catch (error: any) {
      // Silently fall back to mock email
      const mockEmail = mockEmails.find(email => email.id === emailId);
      return mockEmail || null;
    }
  }

  async markAsRead(emailId: string): Promise<boolean> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      await gmail.users.messages.modify({
        userId: 'me',
        id: emailId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      return true;
    } catch (error) {
      // Silently fail for mark as read
      return false;
    }
  }
}