import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    // Check if all required environment variables are present
    const clientId = process.env.GMAIL_CLIENT_ID?.trim().replace(/^['\"]+|['\"]+$/g, '');
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim().replace(/^['\"]+|['\"]+$/g, '');
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim().replace(/^['\"]+|['\"]+$/g, '');

    const diagnostics = {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      clientIdFormat: clientId ? clientId.includes('.apps.googleusercontent.com') : false,
      clientIdLength: clientId?.length || 0,
      refreshTokenFormat: refreshToken ? refreshToken.startsWith('1//') : false,
      refreshTokenLength: refreshToken?.length || 0,
      clientIdPreview: clientId?.substring(0, 50) + '...',
      clientSecretPreview: clientSecret?.substring(0, 20) + '...',
    };

    // Test actual OAuth2 connection and Gmail API
    let authTest = null;
    let gmailApiTest = null;
    
    if (clientId && clientSecret && refreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        // Try to refresh the token
        const { credentials } = await oauth2Client.refreshAccessToken();
        authTest = {
          success: true,
          hasAccessToken: !!credentials.access_token,
          tokenType: credentials.token_type,
          expiryDate: credentials.expiry_date
        };

        // Test Gmail API access
        try {
          const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
          const profile = await gmail.users.getProfile({ userId: 'me' });
          
          gmailApiTest = {
            success: true,
            emailAddress: profile.data.emailAddress,
            messagesTotal: profile.data.messagesTotal,
            threadsTotal: profile.data.threadsTotal
          };
        } catch (gmailError: any) {
          gmailApiTest = {
            success: false,
            error: gmailError.message,
            errorCode: gmailError.code,
            suggestion: gmailError.message.includes('Gmail API') ? 
              'Make sure Gmail API is enabled in Google Cloud Console' : 
              'Check your Gmail API permissions'
          };
        }
      } catch (error: any) {
        authTest = {
          success: false,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.response?.data,
          suggestion: error.message === 'invalid_client' ? 
            'Your Client ID is incorrect. Please check: 1) It should end with .apps.googleusercontent.com 2) Copy it exactly from Google Cloud Console 3) Make sure there are no extra spaces or quotes' :
            error.message === 'unauthorized_client' ?
            'Your app is not authorized. Please check: 1) Make sure your OAuth consent screen is configured 2) Add your email to test users if app is in testing mode 3) Verify redirect URI matches exactly' :
            error.message === 'invalid_grant' ?
            'Your refresh token is invalid or expired. You may need to re-authorize your app in Google OAuth Playground' :
            'Check your Gmail API credentials'
        };
      }
    }

    return NextResponse.json({
      status: 'credentials_check',
      diagnostics,
      authTest,
      gmailApiTest,
      message: 'Gmail API credentials diagnostic complete'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Diagnostic failed', details: error.message },
      { status: 500 }
    );
  }
}