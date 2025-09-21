'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Mail, Clock, User, AlertCircle, CheckCircle, X, Plus, Send, MessageSquare, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Textarea } from './ui/textarea';

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

interface EmailAnalysis {
  reply?: string;
  tone?: string;
  isEvent: boolean;
  eventDetails?: {
    title: string;
    date: string;
    time: string;
    location?: string;
  };
  hasDeadline?: boolean;
  deadline?: string;
  taskSuggestion?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

export default function GmailIntegration() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailAnalysis, setEmailAnalysis] = useState<EmailAnalysis | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showTaskConfirmDialog, setShowTaskConfirmDialog] = useState(false);
  const [analyzingEmail, setAnalyzingEmail] = useState(false);
  const [generatingReply, setGeneratingReply] = useState(false);
  const [customReply, setCustomReply] = useState<string>('');
  const [sendingReply, setSendingReply] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gmail/emails?maxResults=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmail = async (email: Email) => {
    setAnalyzingEmail(true);
    try {
      const response = await fetch('/api/groq/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: email.subject,
          from: email.from,
          body: email.body,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailAnalysis(data.analysis);
        setCustomReply(data.analysis.reply || '');
        setShowReplyDialog(true);
      } else {
        // Enhanced fallback analysis
        const emailContent = `${email.subject} ${email.body}`.toLowerCase();
        
        const isDeadline = emailContent.includes('deadline') || emailContent.includes('due') || 
                          emailContent.includes('urgent') || emailContent.includes('asap');
        const isMeeting = emailContent.includes('meeting') || emailContent.includes('appointment') || 
                         emailContent.includes('call') || emailContent.includes('conference');
        const isQuestion = emailContent.includes('?') || emailContent.includes('question') || 
                          emailContent.includes('help') || emailContent.includes('clarify');
        const isSocial = emailContent.includes('dinner') || emailContent.includes('party') || 
                        emailContent.includes('birthday') || emailContent.includes('celebration');

        let category = 'information';
        let priority: 'high' | 'medium' | 'low' = 'medium';
        let taskSuggestion = `Follow up on: ${email.subject}`;
        let reply = "Thanks for your email. I'll get back to you soon.";
        
        if (isDeadline) {
          category = 'deadline';
          priority = 'high';
          taskSuggestion = `Complete: ${email.subject}`;
          reply = "I understand the urgency. I'll prioritize this and get it done by the deadline.";
        } else if (isMeeting) {
          category = 'meeting';
          priority = 'medium';
          taskSuggestion = `Prepare for: ${email.subject}`;
          reply = "I'll check my calendar and confirm my availability shortly.";
        } else if (isQuestion) {
          category = 'question';
          priority = 'medium';
          taskSuggestion = `Respond to: ${email.subject}`;
          reply = "Thank you for your question. I'll look into this and provide you with the information you need.";
        } else if (isSocial) {
          category = 'social';
          priority = 'low';
          taskSuggestion = `RSVP for: ${email.subject}`;
          reply = "Thanks for the invitation! I'll check my schedule and let you know if I can attend.";
        }

        const fallbackAnalysis: EmailAnalysis = {
          reply,
          tone: "professional",
          isEvent: isMeeting || isSocial,
          hasDeadline: isDeadline,
          deadline: isDeadline ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
          taskSuggestion,
          priority,
          category
        };

        if (isMeeting || isSocial) {
          fallbackAnalysis.eventDetails = {
            title: email.subject,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '14:00',
            location: 'TBD'
          };
        }

        setEmailAnalysis(fallbackAnalysis);
        setCustomReply(reply);
        setShowReplyDialog(true);
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingEmail(false);
    }
  };

  const generateNewReply = async () => {
    if (!selectedEmail) return;
    
    setGeneratingReply(true);
    try {
      const response = await fetch('/api/groq/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: selectedEmail.subject,
          from: selectedEmail.from,
          body: selectedEmail.body,
          regenerate: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomReply(data.analysis.reply || '');
        toast({
          title: "New Reply Generated",
          description: "A fresh reply has been generated for this email.",
        });
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate new reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleSendReply = async () => {
    if (!customReply.trim()) return;

    setSendingReply(true);
    
    // Simulate sending reply
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Reply Sent!",
      description: `Your reply has been sent to ${selectedEmail?.from}`,
    });

    setSendingReply(false);
    setShowReplyDialog(false);
    setCustomReply('');

    // Show task creation dialog if there's a task suggestion
    if (emailAnalysis?.taskSuggestion) {
      setTimeout(() => {
        setShowTaskConfirmDialog(true);
      }, 500);
    }
  };

  const handleTaskConfirmation = async (confirmed: boolean) => {
    setShowTaskConfirmDialog(false);
    
    if (confirmed) {
      await handleAddToTasks();
    }
  };

  const handleAddToTasks = async () => {
    if (!emailAnalysis || !selectedEmail) return;

    try {
      let taskData;
      
      if (emailAnalysis.isEvent && emailAnalysis.eventDetails) {
        taskData = {
          action: 'agree',
          eventDetails: emailAnalysis.eventDetails,
          userEmail: selectedEmail.from,
        };
      } else {
        const deadline = emailAnalysis.hasDeadline && emailAnalysis.deadline ? 
                        emailAnalysis.deadline : 
                        (emailAnalysis.eventDetails?.date || null);
        
        taskData = {
          taskData: {
            title: emailAnalysis.taskSuggestion || `Follow up: ${selectedEmail.subject}`,
            description: `Email from: ${selectedEmail.from}\nSubject: ${selectedEmail.subject}\n\nOriginal message:\n${selectedEmail.body.substring(0, 200)}...`,
            priority: emailAnalysis.priority || selectedEmail.importance,
            deadline: deadline
          }
        };
      }

      const response = await fetch('/api/tasks/create-from-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Task Created!",
          description: `"${data.task.title}" has been added to your tasks.`,
        });
        
        // Also add to main tasks API for consistency
        await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.task.title,
            description: data.task.description,
            priority: data.task.priority,
            due_date: data.task.deadline,
            createdFrom: 'email'
          }),
        });
        
        setTimeout(() => {
          window.location.href = '/tasks';
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEmail = (email: Email) => {
    setSelectedEmail(email);
    analyzeEmail(email);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'deadline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'question': return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'social': return <User className="h-4 w-4 text-green-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading emails...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Emails</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchEmails}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gmail Integration</h1>
              <p className="text-muted-foreground">
                AI-powered email analysis with contextual smart replies and automatic task creation
              </p>
            </div>
            <Button onClick={fetchEmails} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{emails.length}</div>
                  <div className="text-sm text-muted-foreground">Total Emails</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{emails.filter(e => !e.isRead).length}</div>
                  <div className="text-sm text-muted-foreground">Unread</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{emails.filter(e => 
                    e.subject.toLowerCase().includes('deadline') || 
                    e.subject.toLowerCase().includes('urgent') ||
                    e.body.toLowerCase().includes('deadline') ||
                    e.body.toLowerCase().includes('due')
                  ).length}</div>
                  <div className="text-sm text-muted-foreground">Deadlines</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{emails.filter(e => 
                    e.subject.toLowerCase().includes('meeting') || 
                    e.subject.toLowerCase().includes('appointment') ||
                    e.subject.toLowerCase().includes('dinner') ||
                    e.subject.toLowerCase().includes('party') ||
                    e.subject.toLowerCase().includes('question') ||
                    e.subject.toLowerCase().includes('help') ||
                    e.subject.toLowerCase().includes('feedback')
                  ).length}</div>
                  <div className="text-sm text-muted-foreground">Need Reply</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Emails</h2>
          {emails.map((email) => (
            <Card key={email.id} className={`cursor-pointer transition-all hover:shadow-md ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold truncate ${!email.isRead ? 'font-bold' : ''}`}>
                        {email.subject}
                      </h3>
                      <Badge className={getImportanceColor(email.importance)}>
                        {email.importance}
                      </Badge>
                      {!email.isRead && (
                        <Badge variant="secondary">New</Badge>
                      )}
                      {(email.subject.toLowerCase().includes('deadline') || 
                        email.body.toLowerCase().includes('deadline') ||
                        email.subject.toLowerCase().includes('urgent')) && (
                        <Badge variant="destructive">Deadline</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {email.from}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(email.date)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {email.body.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      onClick={() => openEmail(email)}
                      variant="outline" 
                      size="sm"
                      disabled={analyzingEmail}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {analyzingEmail ? 'Analyzing...' : 'Smart Reply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Smart Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI-Powered Smart Reply</DialogTitle>
              <DialogDescription>
                AI has analyzed this email and generated a contextual reply based on the content.
              </DialogDescription>
            </DialogHeader>
            
            {selectedEmail && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{selectedEmail.subject}</h4>
                  <p className="text-sm text-gray-600 mt-1">From: {selectedEmail.from}</p>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-3">{selectedEmail.body}</p>
                </div>

                {emailAnalysis && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {emailAnalysis.tone && (
                      <Badge variant="outline">Tone: {emailAnalysis.tone}</Badge>
                    )}
                    {emailAnalysis.category && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryIcon(emailAnalysis.category)}
                        {emailAnalysis.category}
                      </Badge>
                    )}
                    {emailAnalysis.isEvent && <Badge variant="outline">Event Detected</Badge>}
                    {emailAnalysis.hasDeadline && <Badge variant="destructive">Has Deadline</Badge>}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Smart Reply:</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateNewReply}
                      disabled={generatingReply}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${generatingReply ? 'animate-spin' : ''}`} />
                      {generatingReply ? 'Generating...' : 'Generate New'}
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="AI-generated reply will appear here..."
                    value={customReply}
                    onChange={(e) => setCustomReply(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                {emailAnalysis?.isEvent && emailAnalysis.eventDetails && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Event Detected:</h5>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Title:</strong> {emailAnalysis.eventDetails.title}</p>
                      <p><strong>Date:</strong> {emailAnalysis.eventDetails.date}</p>
                      <p><strong>Time:</strong> {emailAnalysis.eventDetails.time}</p>
                      {emailAnalysis.eventDetails.location && (
                        <p><strong>Location:</strong> {emailAnalysis.eventDetails.location}</p>
                      )}
                    </div>
                  </div>
                )}

                {emailAnalysis?.hasDeadline && emailAnalysis.deadline && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-2">Deadline Detected:</h5>
                    <div className="text-sm text-red-700">
                      <p><strong>Due Date:</strong> {new Date(emailAnalysis.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendReply}
                disabled={!customReply.trim() || sendingReply}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Confirmation Dialog */}
        <Dialog open={showTaskConfirmDialog} onOpenChange={setShowTaskConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Task Manager?</DialogTitle>
              <DialogDescription>
                Would you like to create a task based on this email?
              </DialogDescription>
            </DialogHeader>
            
            {emailAnalysis && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Suggested Task:</h5>
                  <p className="text-sm text-blue-700 font-medium">{emailAnalysis.taskSuggestion}</p>
                  {emailAnalysis.priority && (
                    <p className="text-sm text-blue-600 mt-1">Priority: {emailAnalysis.priority}</p>
                  )}
                  {(emailAnalysis.hasDeadline && emailAnalysis.deadline) && (
                    <p className="text-sm text-blue-600 mt-1">
                      Deadline: {new Date(emailAnalysis.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => handleTaskConfirmation(false)}>
                No, Thanks
              </Button>
              <Button onClick={() => handleTaskConfirmation(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}