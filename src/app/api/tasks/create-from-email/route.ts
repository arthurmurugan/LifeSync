import { NextRequest, NextResponse } from 'next/server';

// In-memory task storage (in a real app, this would be a database)
let tasks: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { action, eventDetails, userEmail, taskData } = await request.json();

    let task;
    
    if (eventDetails) {
      // Create task from event
      task = {
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
    } else if (taskData) {
      // Create task from general email
      task = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'medium',
        deadline: taskData.deadline || null,
        completed: false,
        createdAt: new Date().toISOString(),
        createdFrom: 'email'
      };
    }

    if (task) {
      tasks.push(task);
    }

    return NextResponse.json({ 
      success: true, 
      task,
      message: `Task created: ${task?.title}` 
    });
  } catch (error: any) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: `Failed to create task: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ tasks });
}