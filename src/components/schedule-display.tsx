'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Calendar, Clock, Bell, Edit, Trash2, CalendarDays } from 'lucide-react';

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  reminder_minutes: number;
  created_at: string;
}

export default function ScheduleDisplay() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('today');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    reminder_minutes: 15
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();
      
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        throw new Error(data.error || 'Failed to fetch events');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.date) {
      toast({
        title: "Error",
        description: "Event title and date are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const url = '/api/schedule';
      const method = editingEvent ? 'PUT' : 'POST';
      const payload = editingEvent 
        ? { ...formData, id: editingEvent.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: editingEvent ? "Event updated successfully" : "Event created successfully",
        });
        
        setIsDialogOpen(false);
        resetForm();
        fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to save event');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/schedule?id=${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to delete event');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const editEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      reminder_minutes: event.reminder_minutes
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      reminder_minutes: 15
    });
    setEditingEvent(null);
  };

  const getFilteredEvents = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (viewMode) {
      case 'today':
        return events.filter(event => event.date === today);
      case 'week':
        return events.filter(event => event.date >= today && event.date <= weekFromNow);
      default:
        return events;
    }
  };

  const isEventToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isEventPast = (date: string, time?: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      eventDate.setHours(hours, minutes);
    }
    
    return eventDate < now;
  };

  const filteredEvents = getFilteredEvents().sort((a, b) => {
    const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ''));
    const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ''));
    return dateA.getTime() - dateB.getTime();
  });

  const stats = {
    total: events.length,
    today: events.filter(e => isEventToday(e.date)).length,
    thisWeek: events.filter(e => {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return e.date >= today && e.date <= weekFromNow;
    }).length,
    upcoming: events.filter(e => e.date > new Date().toISOString().split('T')[0]).length
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-orange-600" />
                Schedule Display
              </CardTitle>
              <CardDescription>
                View daily routines and timetables with automated reminder functionality
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                  <DialogDescription>
                    {editingEvent ? 'Update your event details' : 'Add a new event to your schedule'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Event title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Event description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Select value={formData.reminder_minutes.toString()} onValueChange={(value) => setFormData({ ...formData, reminder_minutes: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Reminder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Events</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.today}</div>
              <div className="text-sm text-orange-600">Today</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
              <div className="text-sm text-green-600">This Week</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.upcoming}</div>
              <div className="text-sm text-purple-600">Upcoming</div>
            </div>
          </div>

          {/* View Mode Filter */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={viewMode === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('today')}
            >
              Today
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              This Week
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
            >
              All Events
            </Button>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {loading && events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No events found</p>
                <p className="text-sm">Click "Add Event" to create your first event</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className={`transition-all hover:shadow-md ${isEventPast(event.date, event.time) ? 'opacity-75' : ''} ${isEventToday(event.date) ? 'border-l-4 border-l-orange-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-medium ${isEventPast(event.date, event.time) ? 'line-through text-gray-500' : ''}`}>
                            {event.title}
                          </h3>
                          {isEventToday(event.date) && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              Today
                            </Badge>
                          )}
                          {isEventPast(event.date, event.time) && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Past
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            <span>{event.reminder_minutes}min reminder</span>
                          </div>
                        </div>
                        
                        {event.description && (
                          <p className={`text-sm text-gray-600 ${isEventPast(event.date, event.time) ? 'line-through' : ''}`}>
                            {event.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}