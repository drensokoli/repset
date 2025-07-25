'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import { Exercise } from '@/lib/exercisedb';
import { useWorkoutStore } from '@/lib/workout-store';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { ExerciseFormDialog } from '@/components/exercise-form-dialog';

interface Category {
  name: string;
  slug: string;
}

interface ExerciseLibraryProps {
  onExerciseSelect?: () => void;
  initialData: {
    exercises: Exercise[];
    bodyParts: Category[];
    equipment: Category[];
    muscles: Category[];
  };
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  duration?: number;
  notes: string;
  completed: boolean;
}

// Helper function to create consistent slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

const ExerciseCard = ({ exercise, index, onAdd, isDisabled }: { 
  exercise: Exercise; 
  index: number; 
  onAdd: (details: WorkoutExercise) => void;
  isDisabled: boolean;
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: Math.min(index * 0.05, 1) }}
        className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1 pr-2">{exercise.name}</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => !isDisabled && setShowForm(true)}
            disabled={isDisabled}
            title={isDisabled ? 'Select a day first' : 'Add to workout'}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {exercise.bodyPart}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {exercise.equipment}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            Target: {exercise.target}
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <>, {exercise.secondaryMuscles.join(', ')}</>
            )}
          </p>
          
          {inView && (exercise.imageUrl || exercise.gifUrl) && (
            <div className="relative aspect-[4/3] sm:aspect-video bg-white rounded-lg overflow-hidden">
              <Image
                src={exercise.imageUrl || exercise.gifUrl}
                alt={exercise.name}
                fill
                loading="lazy"
                className="object-contain"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
              />
            </div>
          )}
        </div>
      </motion.div>

      <ExerciseFormDialog
        exercise={exercise}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onAdd={(details) => {
          onAdd(details);
          setShowForm(false);
        }}
      />
    </>
  );
};

export function ExerciseLibrary({ onExerciseSelect, initialData }: ExerciseLibraryProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialData.exercises);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(initialData.exercises);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    bodyParts: [{ name: 'Body Parts', slug: 'all' }, ...initialData.bodyParts],
    equipment: [{ name: 'Equipment', slug: 'all' }, ...initialData.equipment],
    targets: [{ name: 'Muscles', slug: 'all' }, ...initialData.muscles],
  });

  const { selectedDay, addExerciseToDay } = useWorkoutStore();
  const { toast } = useToast();

  // Apply filters whenever they change
  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedBodyPart, selectedEquipment, selectedMuscle]);

  const filterExercises = () => {
    setLoading(true);
    try {
      let filtered = [...initialData.exercises];

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(ex => 
          ex.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply body part filter
      if (selectedBodyPart !== 'all') {
        filtered = filtered.filter(ex => 
          createSlug(ex.bodyPart) === selectedBodyPart
        );
      }

      // Apply equipment filter
      if (selectedEquipment !== 'all') {
        filtered = filtered.filter(ex => 
          createSlug(ex.equipment) === selectedEquipment
        );
      }

      // Apply muscle filter (including secondary muscles)
      if (selectedMuscle !== 'all') {
        filtered = filtered.filter(ex => {
          const matchPrimary = createSlug(ex.target) === selectedMuscle;
          const matchSecondary = ex.secondaryMuscles?.some(
            muscle => createSlug(muscle) === selectedMuscle
          );
          return matchPrimary || matchSecondary;
        });

        // Sort so primary target matches come first, then secondary matches
        filtered = filtered.sort((a, b) => {
          const aPrimary = createSlug(a.target) === selectedMuscle;
          const bPrimary = createSlug(b.target) === selectedMuscle;
          
          // If both are primary or both are secondary, maintain original order
          if (aPrimary === bPrimary) return 0;
          
          // Primary target exercises come first
          return aPrimary ? -1 : 1;
        });
      }

      setFilteredExercises(filtered);
      setError(null);
    } catch (error) {
      console.error('Error filtering exercises:', error);
      setError('Failed to filter exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleBodyPartChange = (value: string) => {
    setSelectedBodyPart(value);
  };

  const handleEquipmentChange = (value: string) => {
    setSelectedEquipment(value);
  };

  const handleMuscleChange = (value: string) => {
    setSelectedMuscle(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBodyPart('all');
    setSelectedEquipment('all');
    setSelectedMuscle('all');
  };

  const addExerciseToWorkout = (exerciseDetails: WorkoutExercise) => {
    if (selectedDay === null) {
      toast({
        title: "Select a day first",
        description: "Please select a day before adding an exercise.",
        variant: "destructive",
      });
      return;
    }

    // Ensure the exercise has an order property (will be set by the store)
    const exerciseWithOrder = {
      ...exerciseDetails,
      duration: exerciseDetails.duration || 0, // Ensure duration is always a number
      order: 0, // This will be overridden by the store
    };

    addExerciseToDay(selectedDay, exerciseWithOrder);
    toast({
      title: "Exercise added",
      description: `Added ${exerciseDetails.name} to ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDay]}`,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 z-10 pb-3 sm:pb-4 space-y-3 sm:space-y-4 px-3 sm:px-4 pt-2 sm:pt-4">
        {/* Search and Filters */}
        <div className="space-y-3 sm:space-y-4">
          {/* Search Bar - Full Width */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 h-10 text-sm"
            />
          </div>

          {/* Filters - Horizontal Scroll on Mobile */}
          <div className="flex gap-2 overflow-x-auto py-2 px-1.5 scrollbar-hide">
            <Select value={selectedBodyPart} onValueChange={handleBodyPartChange}>
              <SelectTrigger className="min-w-[110px] h-9 text-xs sm:text-sm whitespace-nowrap">
                <SelectValue placeholder="Body Part" />
              </SelectTrigger>
              <SelectContent>
                {filters.bodyParts.map((part) => (
                  <SelectItem key={part.slug} value={part.slug}>
                    {part.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMuscle} onValueChange={handleMuscleChange}>
              <SelectTrigger className="min-w-[110px] h-9 text-xs sm:text-sm whitespace-nowrap">
                <SelectValue placeholder="Target Muscle" />
              </SelectTrigger>
              <SelectContent>
                {filters.targets.map((target) => (
                  <SelectItem key={target.slug} value={target.slug}>
                    {target.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedEquipment} onValueChange={handleEquipmentChange}>
              <SelectTrigger className="min-w-[110px] h-9 text-xs sm:text-sm whitespace-nowrap">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                {filters.equipment.map((equip) => (
                  <SelectItem key={equip.slug} value={equip.slug}>
                    {equip.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedBodyPart !== 'all' || selectedEquipment !== 'all' || selectedMuscle !== 'all') && (
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center py-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No exercises found. Try adjusting your search or filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 pb-4">
            <AnimatePresence>
              {filteredExercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onAdd={addExerciseToWorkout}
                  isDisabled={selectedDay === null}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}