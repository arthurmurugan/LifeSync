import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface EmailData {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
  importance: 'high' | 'medium' | 'low';
  labels: string[];
}

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  async getEmails(maxResults: number = 50): Promise<EmailData[]> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox',
      });

      const messages = response.data.messages || [];
      const emails: EmailData[] = [];

      for (const message of messages) {
        if (!message.id) continue;

        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = messageData.data.payload?.headers || [];
          const subjectHeader = headers.find(h => h.name === 'Subject');
          const fromHeader = headers.find(h => h.name === 'From');
          const dateHeader = headers.find(h => h.name === 'Date');

          const email: EmailData = {
            id: message.id,
            subject: subjectHeader?.value || 'No Subject',
            from: fromHeader?.value || 'Unknown Sender',
            snippet: messageData.data.snippet || '',
            date: dateHeader?.value ? new Date(dateHeader.value).toISOString() : new Date().toISOString(),
            isRead: !messageData.data.labelIds?.includes('UNREAD'),
            importance: this.determineImportance(messageData.data.labelIds || []),
            labels: messageData.data.labelIds || [],
          };

          emails.push(email);
        } catch (messageError) {
          console.error(`Error fetching message ${message.id}:`, messageError);
          continue;
        }
      }

      return emails;
    } catch (error) {
      console.error('Gmail API Error:', error);
      throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEmailDetails(emailId: string): Promise<EmailData> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const messageData = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
      });

      const headers = messageData.data.payload?.headers || [];
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const fromHeader = headers.find(h => h.name === 'From');
      const dateHeader = headers.find(h => h.name === 'Date');

      const email: EmailData = {
        id: emailId,
        subject: subjectHeader?.value || 'No Subject',
        from: fromHeader?.value || 'Unknown Sender',
        snippet: messageData.data.snippet || '',
        date: dateHeader?.value ? new Date(dateHeader.value).toISOString() : new Date().toISOString(),
        isRead: !messageData.data.labelIds?.includes('UNREAD'),
        importance: this.determineImportance(messageData.data.labelIds || []),
        labels: messageData.data.labelIds || [],
      };

      return email;
    } catch (error) {
      console.error('Gmail API Error:', error);
      throw new Error(`Failed to fetch email details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendReply(emailId: string, to: string, subject: string, body: string): Promise<{ id: string }> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Create the email content
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `In-Reply-To: ${emailId}`,
        `References: ${emailId}`,
        '',
        body
      ].join('\n');

      // Encode the email in base64url format
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: emailId,
        },
      });

      return { id: response.data.id || '' };
    } catch (error) {
      console.error('Gmail Send Reply Error:', error);
      throw new Error(`Failed to send reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private determineImportance(labels: string[]): 'high' | 'medium' | 'low' {
    if (labels.includes('IMPORTANT') || labels.includes('CATEGORY_PRIMARY')) {
      return 'high';
    }
    if (labels.includes('CATEGORY_SOCIAL') || labels.includes('CATEGORY_PROMOTIONS')) {
      return 'low';
    }
    return 'medium';
  }
}