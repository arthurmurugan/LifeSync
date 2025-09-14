'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Mail, RefreshCw, AlertCircle, CheckCircle, Clock, User, Reply, Bot, Send } from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  fullBody?: string;
  date: string;
  isRead: boolean;
  importance: 'high' | 'medium' | 'low';
  labels: string[];
}

export default function GmailIntegration() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const { toast } = useToast();

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gmail/emails');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails');
      }
      
      setEmails(data.emails || []);
      setConnectionStatus('connected');
      toast({
        title: "Success",
        description: `Loaded ${data.emails?.length || 0} emails from Gmail`,
      });
    } catch (err: any) {
      console.error('Gmail fetch error:', err);
      setError(err.message);
      setConnectionStatus('error');
      setEmails([]); // Clear emails on error
      toast({
        title: "Gmail Error",
        description: err.message.includes('unauthorized_client') 
          ? "Gmail app not authorized. Please check your Google Cloud Console setup."
          : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailDetails = async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/email/${emailId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch email details');
      }
      
      return data.email;
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load email details",
        variant: "destructive",
      });
      return null;
    }
  };

  const generateAutoReply = async (email: Email) => {
    setIsGeneratingReply(true);
    
    try {
      const response = await fetch('/api/groq/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: email.subject,
          from: email.from,
          body: email.fullBody || email.snippet,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate reply');
      }
      
      setReplyText(data.reply);
      toast({
        title: "AI Reply Generated",
        description: "Auto-reply has been generated using Groq AI",
      });
    } catch (err: any) {
      toast({
        title: "AI Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const sendReply = async (email: Email, replyContent: string) => {
    setIsSendingReply(true);
    
    try {
      const response = await fetch('/api/gmail/send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: email.id,
          to: email.from,
          subject: `Re: ${email.subject}`,
          body: replyContent,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }
      
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully",
      });
      
      setReplyText('');
      setSelectedEmail(null);
    } catch (err: any) {
      toast({
        title: "Send Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleEmailClick = async (email: Email) => {
    const emailDetails = await fetchEmailDetails(email.id);
    if (emailDetails) {
      setSelectedEmail({ ...email, fullBody: emailDetails.fullBody });
    }
  };

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Show mock data when there's an error to demonstrate the UI
  const displayEmails = error && emails.length === 0 ? [
    {
      id: 'mock-1',
      subject: 'Welcome to Gmail Integration',
      from: 'demo@example.com',
      snippet: 'This is a demo email showing how the Gmail integration would work once properly configured.',
      fullBody: 'This is a demo email showing how the Gmail integration would work once properly configured. You can reply to this message and use the AI auto-reply feature.',
      date: new Date().toISOString(),
      isRead: false,
      importance: 'high' as const,
      labels: ['INBOX']
    },
    {
      id: 'mock-2',
      subject: 'Meeting Reminder',
      from: 'calendar@company.com',
      snippet: 'Don\'t forget about the team meeting scheduled for tomorrow at 2 PM.',
      fullBody: 'Don\'t forget about the team meeting scheduled for tomorrow at 2 PM. Please confirm your attendance and let us know if you have any agenda items to discuss.',
      date: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
      importance: 'medium' as const,
      labels: ['INBOX']
    }
  ] : emails;

  return (
    <div className="bg-white min-h-screen p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-600" />
              <CardTitle>Gmail Integration with AI Auto-Reply</CardTitle>
              {getConnectionStatusIcon()}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchEmails}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Refresh Emails"}
              </Button>
            </div>
          </div>
          <CardDescription>
            AI-powered message integration with Groq auto-reply functionality
            {error && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>Demo Mode:</strong> Showing sample data due to configuration issue. {error}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Configuration Required</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {error.includes('unauthorized_client') 
                  ? "Your Gmail app needs to be authorized in Google Cloud Console. Check: 1) OAuth consent screen is configured 2) Your email is added to test users 3) Redirect URI matches exactly"
                  : error
                }
              </p>
            </div>
          )}

          <div className="space-y-4">
            {displayEmails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No emails to display</p>
                <p className="text-sm">Click "Refresh Emails" to load your Gmail messages</p>
              </div>
            ) : (
              displayEmails.map((email) => (
                <Card key={email.id} className={`transition-all hover:shadow-md cursor-pointer ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0" onClick={() => handleEmailClick(email)}>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-medium truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                            {email.subject}
                          </h3>
                          <Badge className={getImportanceBadgeColor(email.importance)}>
                            {email.importance}
                          </Badge>
                          {!email.isRead && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              New
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="h-3 w-3" />
                          <span className="truncate">{email.from}</span>
                          <span>•</span>
                          <span>{new Date(email.date).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {email.snippet}
                        </p>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEmailClick(email)}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Reply to: {email.subject}</DialogTitle>
                            <DialogDescription>
                              From: {email.from}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-2">Original Message:</h4>
                              <p className="text-sm text-gray-700">
                                {email.fullBody || email.snippet}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Your Reply:</label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateAutoReply(email)}
                                  disabled={isGeneratingReply}
                                >
                                  {isGeneratingReply ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Bot className="h-4 w-4 mr-1" />
                                  )}
                                  Auto Reply
                                </Button>
                              </div>
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply here..."
                                rows={6}
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReplyText('');
                                  setSelectedEmail(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => sendReply(email, replyText)}
                                disabled={!replyText.trim() || isSendingReply}
                              >
                                {isSendingReply ? (
                                  <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Send className="h-4 w-4 mr-1" />
                                )}
                                Send Reply
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {displayEmails.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Showing {displayEmails.length} messages</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>High Priority</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Medium Priority</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Low Priority</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}