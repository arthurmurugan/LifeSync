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
import { Calendar, Plus, Edit, Trash2, Clock, Bell, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'task' | 'reminder' | 'event';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderMinutes: number;
  createdAt: string;
}

export default function ScheduleDisplay() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'meeting' as 'meeting' | 'task' | 'reminder' | 'event',
    recurrence: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    reminderMinutes: 15,
  });

  // Load schedule items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('scheduleItems');
    if (savedItems) {
      setScheduleItems(JSON.parse(savedItems));
    } else {
      // Initialize with sample schedule items
      const sampleItems: ScheduleItem[] = [
        {
          id: '1',
          title: 'Team Standup',
          description: 'Daily team standup meeting to discuss progress and blockers.',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '09:30',
          type: 'meeting',
          recurrence: 'daily',
          reminderMinutes: 15,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Project Review',
          description: 'Review project milestones and deliverables with stakeholders.',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '15:30',
          type: 'meeting',
          recurrence: 'none',
          reminderMinutes: 30,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Code Review',
          description: 'Review pull requests and provide feedback to team members.',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '11:00',
          endTime: '12:00',
          type: 'task',
          recurrence: 'weekly',
          reminderMinutes: 10,
          createdAt: new Date().toISOString(),
        },
      ];
      setScheduleItems(sampleItems);
      localStorage.setItem('scheduleItems', JSON.stringify(sampleItems));
    }
  }, []);

  // Save schedule items to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('scheduleItems', JSON.stringify(scheduleItems));
  }, [scheduleItems]);

  const addScheduleItem = () => {
    if (!formData.title.trim() || !formData.date || !formData.startTime) {
      toast({
        title: "Error",
        description: "Title, date, and start time are required",
        variant: "destructive",
      });
      return;
    }

    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime || formData.startTime,
      type: formData.type,
      recurrence: formData.recurrence,
      reminderMinutes: formData.reminderMinutes,
      createdAt: new Date().toISOString(),
    };

    setScheduleItems([...scheduleItems, newItem]);
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'meeting',
      recurrence: 'none',
      reminderMinutes: 15,
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Schedule item added successfully",
    });
  };

  const updateScheduleItem = () => {
    if (!editingItem || !formData.title.trim() || !formData.date || !formData.startTime) {
      toast({
        title: "Error",
        description: "Title, date, and start time are required",
        variant: "destructive",
      });
      return;
    }

    const updatedItems = scheduleItems.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            title: formData.title,
            description: formData.description,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime || formData.startTime,
            type: formData.type,
            recurrence: formData.recurrence,
            reminderMinutes: formData.reminderMinutes,
          }
        : item
    );

    setScheduleItems(updatedItems);
    setFormData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'meeting',
      recurrence: 'none',
      reminderMinutes: 15,
    });
    setEditingItem(null);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Schedule item updated successfully",
    });
  };

  const deleteScheduleItem = (itemId: string) => {
    const updatedItems = scheduleItems.filter(item => item.id !== itemId);
    setScheduleItems(updatedItems);
    
    toast({
      title: "Success",
      description: "Schedule item deleted successfully",
    });
  };

  const openEditDialog = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      type: item.type,
      recurrence: item.recurrence,
      reminderMinutes: item.reminderMinutes,
    });
    setIsEditDialogOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task': return 'bg-green-100 text-green-800 border-green-200';
      case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecurrenceIcon = (recurrence: string) => {
    if (recurrence !== 'none') {
      return <Repeat className="h-3 w-3" />;
    }
    return null;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  const isUpcoming = (date: string, startTime: string) => {
    const itemDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    return itemDateTime > now;
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getFilteredItems = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (viewMode) {
      case 'day':
        const dayDate = currentDate.toISOString().split('T')[0];
        return scheduleItems.filter(item => item.date === dayDate);
      
      case 'week':
        const weekDates = getWeekDates(currentDate);
        const weekStart = weekDates[0].toISOString().split('T')[0];
        const weekEnd = weekDates[6].toISOString().split('T')[0];
        return scheduleItems.filter(item => item.date >= weekStart && item.date <= weekEnd);
      
      case 'month':
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
        return scheduleItems.filter(item => item.date >= monthStart && item.date <= monthEnd);
      
      default:
        return scheduleItems;
    }
  };

  const sortedItems = getFilteredItems().sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingItems = scheduleItems
    .filter(item => isUpcoming(item.date, item.startTime))
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  return (
    <div className="bg-white min-h-screen p-6">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <CardTitle>Schedule Display</CardTitle>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Schedule Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Schedule Item</DialogTitle>
                  <DialogDescription>
                    Create a new schedule item with reminders and recurrence options.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter schedule item title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select value={formData.type} onValueChange={(value: 'meeting' | 'task' | 'reminder' | 'event') => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Time *</label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Recurrence</label>
                      <Select value={formData.recurrence} onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => setFormData({ ...formData, recurrence: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reminder (minutes before)</label>
                      <Select value={formData.reminderMinutes.toString()} onValueChange={(value) => setFormData({ ...formData, reminderMinutes: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addScheduleItem}>Add Item</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Daily routines and timetables with automated reminder functionality
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* View Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold min-w-48 text-center">
                {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {viewMode === 'week' && `Week of ${getWeekDates(currentDate)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </div>

          {/* Upcoming Items Summary */}
          {upcomingItems.length > 0 && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Upcoming Items
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {upcomingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString()} at {formatTime(item.startTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Items */}
          <div className="space-y-4">
            {sortedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No schedule items found</p>
                <p className="text-sm">Add a new schedule item to get started</p>
              </div>
            ) : (
              sortedItems.map((item) => (
                <Card key={item.id} className={`transition-all hover:shadow-md ${isToday(item.date) ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{item.title}</h3>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                          {getRecurrenceIcon(item.recurrence)}
                          {isToday(item.date) && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Today
                            </Badge>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-700 mb-2">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTime(item.startTime)}
                              {item.endTime && item.endTime !== item.startTime && ` - ${formatTime(item.endTime)}`}
                            </span>
                          </div>
                          {item.reminderMinutes > 0 && (
                            <div className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              <span>{item.reminderMinutes}min reminder</span>
                            </div>
                          )}
                          {item.recurrence !== 'none' && (
                            <div className="flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              <span>{item.recurrence}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteScheduleItem(item.id)}
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

      {/* Edit Schedule Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule Item</DialogTitle>
            <DialogDescription>
              Update schedule item details, time, and recurrence settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter schedule item title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(value: 'meeting' | 'task' | 'reminder' | 'event') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Recurrence</label>
                <Select value={formData.recurrence} onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => setFormData({ ...formData, recurrence: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Reminder (minutes before)</label>
                <Select value={formData.reminderMinutes.toString()} onValueChange={(value) => setFormData({ ...formData, reminderMinutes: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateScheduleItem}>Update Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}