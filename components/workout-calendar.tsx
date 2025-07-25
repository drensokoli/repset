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
import { format, addDays, subDays, isSameDay, startOfDay, startOfWeek, endOfWeek, addWeeks, subWeeks, differenceInDays } from 'date-fns';
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
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCalendar, setShowCalendar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with today's date and week
  useEffect(() => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    setCurrentDate(today);
    setWeekStart(todayWeekStart);
    setSelectedDay(convertDayIndex(today.getDay()));
  }, []); // Empty dependency array - only run on mount

  // Fetch weekly workout data when week changes
  useEffect(() => {
    fetchWeeklyWorkoutData(weekStart);
    setCurrentWeek(weekStart);
  }, [weekStart, fetchWeeklyWorkoutData, setCurrentWeek]);

  // Handle scrolling when week or selected day changes
  useEffect(() => {
    // Only proceed if we have a valid weekStart and selectedDay
    if (!weekStart || selectedDay === undefined || !scrollRef.current) return;

    // Small delay to ensure DOM is rendered and data is loaded
    const timeoutId = setTimeout(() => {
      // Find the date in the current week that matches the selected day
      // We need to find which day of the week corresponds to our selectedDay
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dayIndex = convertDayIndex(date.getDay());
        if (dayIndex === selectedDay) {
          console.log('Scrolling to selected day:', date, 'selectedDay index:', selectedDay);
          scrollToDay(date);
          break;
        }
      }
    }, 500); // Increased delay slightly to ensure everything is ready

    return () => clearTimeout(timeoutId);
  }, [weekStart, selectedDay, isLoading]); // Added isLoading dependency

  // Helper function to scroll to a specific day
  const scrollToDay = (targetDate: Date) => {
    if (!scrollRef.current) return;

    // Calculate which card position (0-6) corresponds to the target date
    // Cards are rendered as: weekStart + 0, weekStart + 1, ..., weekStart + 6
    const dayPosition = differenceInDays(startOfDay(targetDate), startOfDay(weekStart));

    // Ensure we have a valid day position (0-6)
    if (dayPosition < 0 || dayPosition > 6) {
      console.log('Target date is not in current week:', targetDate, 'Week start:', weekStart);
      return;
    }

    // Card dimensions (should match the min-w classes in the component)
    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? 140 : 160; // matches min-w-[140px] sm:min-w-[160px]
    const gap = 8; // matches gap-2 which is 8px
    const cardTotalWidth = cardWidth + gap;

    // Calculate scroll position - center the target day's card
    const containerWidth = scrollRef.current.clientWidth;
    const cardCenter = (dayPosition * cardTotalWidth) + (cardWidth / 2);
    const scrollPosition = cardCenter - (containerWidth / 2);

    // Ensure we don't scroll past boundaries
    const maxScroll = scrollRef.current.scrollWidth - containerWidth;
    const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));

    console.log('Scrolling to day:', targetDate, 'Card position:', dayPosition, 'Scroll to:', finalScrollPosition);

    scrollRef.current.scrollTo({
      left: finalScrollPosition,
      behavior: 'smooth'
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'next'
      ? addWeeks(weekStart, 1)
      : subWeeks(weekStart, 1);

    // Update week start (this will trigger data fetch and auto-scroll)
    setWeekStart(newWeekStart);

    // Keep the same day of the week selected (e.g., if Tuesday was selected, select Tuesday of new week)
    // Calculate which day of the week we're currently on (0=Monday, 1=Tuesday, etc.)
    const currentDayOfWeek = Math.floor((currentDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
    const newCurrentDate = addDays(newWeekStart, currentDayOfWeek);

    setCurrentDate(newCurrentDate);
    // selectedDay stays the same as it represents the same day of the week

    // Scroll to the selected day in the new week
    setTimeout(() => {
      scrollToDay(newCurrentDate);
    }, 150);
  };

  const scrollToToday = () => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    console.log('ScrollToToday called - Today:', today, 'Current week start:', weekStart, 'Today week start:', todayWeekStart);

    // Set today as current date and selected day
    setCurrentDate(today);
    setSelectedDay(convertDayIndex(today.getDay()));

    // Only fetch new data if today is in a different week
    if (!isSameDay(todayWeekStart, weekStart)) {
      console.log('Switching to today\'s week');
      setWeekStart(todayWeekStart);
    } else {
      // If we're already in today's week, just scroll to today
      console.log('Already in today\'s week, just scrolling');
      setTimeout(() => {
        scrollToDay(today);
      }, 100);
    }
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

    console.log('Date selected:', date, 'Day index:', newDayIndex);

    // Always update the selected day and current date (for UI state)
    setSelectedDay(newDayIndex);
    setCurrentDate(date);
    setShowCalendar(false);

    // Only update week and fetch new data if we're selecting a date in a different week
    if (!isSameDay(newWeekStart, weekStart)) {
      console.log('Switching to different week for selected date');
      setWeekStart(newWeekStart);
    } else {
      // If we're in the same week, just scroll to the selected day
      console.log('Same week, scrolling to selected day');
      setTimeout(() => {
        scrollToDay(date);
      }, 100);
    }
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
      <Card className="xl:w-fit w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-start">
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
                    'min-w-[130px] sm:min-w-[160px] p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 snap-center shrink-0',
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

          <div className="flex justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && handleDateSelect(date)}
              initialFocus
              className="w-fit"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}