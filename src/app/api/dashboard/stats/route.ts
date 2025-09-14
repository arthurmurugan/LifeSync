import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tasks count
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('completed', false);

    // Get schedule events count for today
    const today = new Date().toISOString().split('T')[0];
    const { data: events, error: eventsError } = await supabase
      .from('schedule_events')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('date', today)
      .lt('date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Mock data for now since we don't have real Gmail/IoT integration yet
    const stats = {
      unreadMessages: 3, // Mock Gmail data
      pendingTasks: tasks?.length || 0,
      connectedDevices: 5, // Mock IoT data
      todayEvents: events?.length || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}