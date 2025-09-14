import { google } from 'googleapis';

export class GmailService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  async getEmails(maxResults: number = 50) {
    try {
      console.log('Initializing Gmail OAuth2 client...');
      
      // Refresh the access token
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      console.log('Access token refreshed successfully');

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      console.log('Fetching Gmail emails...');
      
      // Get list of messages
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: 'in:inbox',
      });

      const messages = messagesResponse.data.messages || [];
      console.log(`Found ${messages.length} messages`);

      // Get detailed information for each message
      const emailPromises = messages.map(async (message) => {
        const messageDetail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full',
        });

        const headers = messageDetail.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
        const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

        return {
          id: message.id!,
          subject,
          from,
          snippet: messageDetail.data.snippet || '',
          date: new Date(date).toISOString(),
          isRead: !messageDetail.data.labelIds?.includes('UNREAD'),
          importance: this.calculateImportance(subject, from),
          labels: messageDetail.data.labelIds || [],
        };
      });

      const emails = await Promise.all(emailPromises);
      console.log(`Successfully processed ${emails.length} emails`);
      
      return emails;
    } catch (error: any) {
      console.error('Gmail API Error:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message === 'unauthorized_client') {
        errorMessage = 'Gmail app not authorized. Please check: 1) OAuth consent screen is configured 2) Your email is added to test users 3) Redirect URI matches exactly';
      } else if (error.message === 'invalid_client') {
        errorMessage = 'Invalid Gmail Client ID. Please verify it ends with .apps.googleusercontent.com';
      } else if (error.message === 'invalid_grant') {
        errorMessage = 'Refresh token expired. Please re-authorize your app in Google OAuth Playground';
      }
      
      throw new Error(`Gmail API authentication failed: ${errorMessage}`);
    }
  }

  async getEmailDetails(emailId: string) {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      const messageDetail = await gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      });

      const headers = messageDetail.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

      // Extract email body
      let fullBody = '';
      const payload = messageDetail.data.payload;
      
      if (payload?.body?.data) {
        fullBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload?.parts) {
        // Handle multipart messages
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            fullBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
      }

      return {
        id: emailId,
        subject,
        from,
        snippet: messageDetail.data.snippet || '',
        fullBody: fullBody || messageDetail.data.snippet || '',
        date: new Date(date).toISOString(),
        isRead: !messageDetail.data.labelIds?.includes('UNREAD'),
        importance: this.calculateImportance(subject, from),
        labels: messageDetail.data.labelIds || [],
      };
    } catch (error: any) {
      console.error('Gmail Email Details Error:', error);
      throw new Error(`Failed to fetch email details: ${error.message}`);
    }
  }

  async sendReply(emailId: string, to: string, subject: string, body: string) {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Create the email message
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      // Encode the email in base64
      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: emailId, // This will group the reply with the original email
        },
      });

      console.log('Reply sent successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Gmail Send Reply Error:', error);
      throw new Error(`Failed to send reply: ${error.message}`);
    }
  }

  private calculateImportance(subject: string, from: string): 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'asap', 'important', 'critical', 'emergency'];
    const mediumKeywords = ['meeting', 'deadline', 'reminder', 'action required'];
    
    const subjectLower = subject.toLowerCase();
    const fromLower = from.toLowerCase();
    
    if (urgentKeywords.some(keyword => subjectLower.includes(keyword))) {
      return 'high';
    }
    
    if (mediumKeywords.some(keyword => subjectLower.includes(keyword)) || 
        fromLower.includes('noreply') || fromLower.includes('no-reply')) {
      return 'medium';
    }
    
    return 'low';
  }
}