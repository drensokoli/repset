'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/lib/workout-store';
import { Navbar } from '@/components/navbar';
import { WorkoutCalendar } from '@/components/workout-calendar';
import { ExerciseLibrary } from '@/components/exercise-library';
import { WorkoutDay } from '@/components/workout-day';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Dumbbell, Calendar, Plus, Download, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Exercise } from '@/lib/exercisedb';
import { format } from 'date-fns';

interface Category {
  name: string;
  slug: string;
}

interface HomeClientProps {
  initialData: {
    exercises: Exercise[];
    bodyParts: Category[];
    equipment: Category[];
    muscles: Category[];
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function HomeClient({ initialData }: HomeClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { template, weeklyData, fetchWeeklyWorkoutData, getCurrentDayLog } = useWorkoutStore();
  const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Initialize workout data
  useEffect(() => {
    if (session?.user) {
      const today = new Date();
      fetchWeeklyWorkoutData(today);
    }
  }, [session, fetchWeeklyWorkoutData]);

  // PWA installation
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated state
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Dumbbell className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">RepSet</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Your ultimate workout companion for planning, tracking, and achieving your fitness goals
          </p>
          <Button onClick={() => router.push('/auth/signin')} size="lg">
            Get Started
          </Button>
        </motion.div>
      </div>
    );
  }

  // Calculate total exercises from template
  const getTotalExercises = () => {
    if (!template) return 0;
    
    return DAYS.reduce((total, day) => {
      return total + (template[day]?.exercises?.length || 0);
    }, 0);
  };

  // Main app view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {session.user.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Ready to crush your fitness goals this week?
              </p>
            </div>
            {installPrompt && (
              <Button onClick={handleInstallPWA} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Calendar View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WorkoutCalendar />
          </motion.div>

          {/* Selected Day's Workout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WorkoutDay 
              isExerciseLibraryOpen={isExerciseLibraryOpen}
              setIsExerciseLibraryOpen={setIsExerciseLibraryOpen}
            />
          </motion.div>
        </div>

        {/* Exercise Library Modal */}
        <Dialog open={isExerciseLibraryOpen} onOpenChange={setIsExerciseLibraryOpen}>
          <DialogContent className="flex flex-col max-w-4xl h-[90vh] p-0 gap-0">
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 z-20 px-4 py-4 border-b mx-4 my-2">
              <div className="flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle>Exercise Library</DialogTitle>
                </DialogHeader>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={() => setIsExerciseLibraryOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ExerciseLibrary 
                initialData={initialData}
                onExerciseSelect={() => setIsExerciseLibraryOpen(false)} 
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCurrentDayLog()?.completed ? 1 : 0}/7
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Days completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTotalExercises()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Planned this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">🔥 0</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Days in a row
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 