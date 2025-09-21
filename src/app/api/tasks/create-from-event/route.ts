import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, eventDetails, userEmail } = await request.json();

    // Create task from event
    const task = {
      id: Date.now().toString(),
      title: eventDetails.title,
      description: `Event: ${eventDetails.title}\nDate: ${eventDetails.date}\nTime: ${eventDetails.time}\nLocation: ${eventDetails.location || 'Not specified'}`,
      priority: 'medium',
      deadline: eventDetails.date,
      completed: false,
      createdAt: new Date().toISOString(),
      createdFrom: 'email',
      eventDetails
    };

    // In a real app, you'd save this to your database
    // For now, we'll return the task data to be handled by the frontend
    
    return NextResponse.json({ 
      success: true, 
      task,
      message: `Task created for event: ${eventDetails.title}` 
    });
  } catch (error: any) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: `Failed to create task: ${error.message}` },
      { status: 500 }
    );
  }
}