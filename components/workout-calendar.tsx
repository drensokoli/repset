'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkoutStore, DayTemplate } from '@/lib/workout-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CalendarIcon,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, isSameDay, startOfDay, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay
} from "@/components/ui/dialog";

// WeekLogs interface removed - now using WeeklyWorkoutLog from workout-store

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Helper function to convert between system day index (0-6, Sunday-Saturday) 
// and our day index (0-6, Sunday-Saturday) - now they match!
const convertDayIndex = (systemDayIndex: number): number => {
  // System: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Our: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return systemDayIndex; // No conversion needed - they match!
};

// Helper function to convert our day index back to system day index
const convertToSystemDayIndex = (ourDayIndex: number): number => {
  // Our: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // System: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return ourDayIndex; // No conversion needed - they match!
};

export function WorkoutCalendar() {
  const { template, weeklyData, selectedDay, setSelectedDay, isLoading, fetchWeeklyWorkoutData, setCurrentWeek } = useWorkoutStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [showCalendar, setShowCalendar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize week dates only when component mounts or when explicitly navigating weeks
  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    setWeekStart(start);
  }, []); // Empty dependency array - only run on mount

  // Fetch weekly workout data when week changes
  useEffect(() => {
    fetchWeeklyWorkoutData(weekStart);
    setCurrentWeek(weekStart);
    
    // Auto-scroll to today if we're viewing the current week
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    if (isSameDay(todayWeekStart, weekStart)) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (scrollRef.current) {
          const daysSinceWeekStart = Math.floor((today.getTime() - todayWeekStart.getTime()) / (24 * 60 * 60 * 1000));
          const isMobile = window.innerWidth < 640;
          const cardWidth = isMobile ? 140 : 160;
          const gap = 8;
          const cardTotalWidth = cardWidth + gap;
          
          // Calculate scroll position - center today's card
          const containerWidth = scrollRef.current.clientWidth;
          const cardCenter = (daysSinceWeekStart * cardTotalWidth) + (cardWidth / 2);
          const scrollPosition = cardCenter - (containerWidth / 2);
          
          // Ensure we don't scroll past boundaries
          const maxScroll = scrollRef.current.scrollWidth - containerWidth;
          const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
          
          scrollRef.current.scrollTo({
            left: finalScrollPosition,
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  }, [weekStart, fetchWeeklyWorkoutData, setCurrentWeek]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'next' 
      ? addWeeks(weekStart, 1)
      : subWeeks(weekStart, 1);
    
    // Update week start (this will trigger data fetch and auto-scroll)
    setWeekStart(newWeekStart);
    
    // Keep the same day of the week selected (e.g., if Tuesday was selected, select Tuesday of new week)
    const newCurrentDate = addDays(newWeekStart, selectedDay === 0 ? 6 : selectedDay - 1); // Adjust for Monday=1 start
    setCurrentDate(newCurrentDate);
    // selectedDay stays the same
    
    // Scroll to the selected day in the new week
    setTimeout(() => {
      if (scrollRef.current) {
        // Convert selectedDay to card position (0-6 where 0=Monday, 6=Sunday)
        const dayPosition = selectedDay === 0 ? 6 : selectedDay - 1;
        
        // Card dimensions
        const isMobile = window.innerWidth < 640;
        const cardWidth = isMobile ? 140 : 160;
        const gap = 8;
        const cardTotalWidth = cardWidth + gap;
        
        // Calculate scroll position - try to center the selected day
        const containerWidth = scrollRef.current.clientWidth;
        const cardCenter = (dayPosition * cardTotalWidth) + (cardWidth / 2);
        const scrollPosition = cardCenter - (containerWidth / 2);
        
        // Ensure we don't scroll past boundaries
        const maxScroll = scrollRef.current.scrollWidth - containerWidth;
        const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
        
        scrollRef.current.scrollTo({
          left: finalScrollPosition,
          behavior: 'smooth'
        });
      }
    }, 150); // Slightly longer delay to ensure DOM is ready
  };

  const scrollToToday = () => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    // Only fetch new data if today is in a different week
    if (!isSameDay(todayWeekStart, weekStart)) {
      setWeekStart(todayWeekStart);
    }
    
    setCurrentDate(today);
    setSelectedDay(convertDayIndex(today.getDay()));
    
    // Scroll to today's card in mobile view
    const scrollToTodayCard = () => {
      if (scrollRef.current) {
        // Calculate today's position in the week (0-6, where 0 is Monday - the week start)
        const daysSinceWeekStart = Math.floor((today.getTime() - todayWeekStart.getTime()) / (24 * 60 * 60 * 1000));
        
        // Card dimensions
        const isMobile = window.innerWidth < 640;
        const cardWidth = isMobile ? 140 : 160;
        const gap = 8;
        const cardTotalWidth = cardWidth + gap;
        
        // Calculate scroll position - center today's card
        const containerWidth = scrollRef.current.clientWidth;
        const cardCenter = (daysSinceWeekStart * cardTotalWidth) + (cardWidth / 2);
        const scrollPosition = cardCenter - (containerWidth / 2);
        
        // Ensure we don't scroll past boundaries
        const maxScroll = scrollRef.current.scrollWidth - containerWidth;
        const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
        
        scrollRef.current.scrollTo({
          left: finalScrollPosition,
          behavior: 'smooth'
        });
      }
    };
    
    // Small delay to ensure DOM is updated if we switched weeks
    setTimeout(scrollToTodayCard, 100);
  };

  const getDayWorkout = (date: Date): DayTemplate | null => {
    if (!template) return null;
    
    const dayIndex = convertDayIndex(date.getDay());
    const dayName = DAYS[dayIndex] as keyof typeof template;
    const dayTemplate = template[dayName] as DayTemplate;
    return dayTemplate || null;
  };

  const handleDateSelect = (date: Date) => {
    const newDayIndex = convertDayIndex(date.getDay());
    const newWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    
    // Only update week and fetch new data if we're selecting a date in a different week
    if (!isSameDay(newWeekStart, weekStart)) {
      setWeekStart(newWeekStart);
    }
    
    // Always update the selected day and current date (for UI state)
    setSelectedDay(newDayIndex);
    setCurrentDate(date);
    setShowCalendar(false);
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendar(true)}
                className="font-medium"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(weekStart, 'MMMM yyyy')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToToday}
                className={cn(
                  "ml-2",
                  isToday(currentDate) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide snap-x snap-mandatory"
          >
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(weekStart, i);
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayWorkout = getDayWorkout(date);
              const dayIndex = convertDayIndex(date.getDay());
              const dayLog = weeklyData?.[dayIndex.toString()];
              const isSelected = selectedDay === dayIndex;
              const isCompleted = dayLog?.completed;
              const exerciseCount = dayWorkout?.exercises.length || 0;
              const isCurrentDay = isToday(date);

              return (
                <motion.div
                  key={date.toISOString()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'min-w-[140px] sm:min-w-[160px] p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 snap-center shrink-0',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700',
                    isCurrentDay && !isSelected && 'border-primary'
                  )}
                  onClick={() => handleDateSelect(date)}
                >
                  <div className="flex flex-col gap-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">
                          {format(date, 'EEE')}
                        </h3>
                        {isCompleted && (
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">{format(date, 'MMM d')}</span>
                        {isCurrentDay && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">Today</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      {exerciseCount > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Plus className="h-3 w-3" />
                          <span className="text-xs">Add</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && handleDateSelect(date)}
            initialFocus
          />
        </DialogContent>
      </Dialog>
    </>
  );
}