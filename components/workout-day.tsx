'use client';

import { useState, Dispatch, SetStateAction, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  CheckCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  GripVertical,
  Timer,
  Target,
  Weight,
  Loader2,
  Edit,
  Trash
} from 'lucide-react';
import { useWorkoutStore, WorkoutExercise } from '@/lib/workout-store';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragOverlay,
  DragOverlay as DragOverlayComponent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface SortableExerciseItemProps {
  exercise: WorkoutExercise;
  index: number;
  isCompleted: boolean;
  editingExercise: string | null;
  editForm: Partial<WorkoutExercise>;
  formErrors: {
    sets?: string;
    reps?: string;
    duration?: string;
  };
  onStartEdit: (exercise: WorkoutExercise) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleComplete: (exerciseId: string) => void;
  onEditFormChange: (updates: Partial<WorkoutExercise>) => void;
  onFormErrorChange: (errors: { sets?: string; reps?: string; duration?: string; }) => void;
  onRemove: (exerciseId: string) => void;
  isRemoving: boolean;
  onStartRemove: () => void;
  onCancelRemove: () => void;
}

function SortableExerciseItem({
  exercise,
  index,
  isCompleted,
  editingExercise,
  editForm,
  formErrors,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onToggleComplete,
  onEditFormChange,
  onFormErrorChange,
  isRemoving,
  onStartRemove,
  onCancelRemove,
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 1,
    boxShadow: isDragging ? '0 10px 25px rgba(0, 0, 0, 0.15)' : undefined,
    scale: isDragging ? 1.02 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-lg p-4 transition-all duration-200 ${isDragging
        ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
        : isCompleted
          ? ''
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
    >
      {/* Main Content Container */}
      <div className="flex flex-col space-y-4">
        {/* Header Section */}
        <div className="flex items-start gap-3">
          {/* Drag Handle - Larger Touch Area */}
          <div
            className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing touch-manipulation select-none"
            {...attributes}
            {...listeners}
            style={{
              touchAction: 'none', // Prevent browser scrolling during drag
              userSelect: 'none',
              WebkitUserSelect: 'none',
              minWidth: '24px',
              minHeight: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </div>
          </div>

          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-row justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold text-sm sm:text-base break-words`}>
                  {exercise.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <Target className="h-3 w-3" />
                    {exercise.sets} sets
                  </div>
                  {exercise.reps ? (
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                      <Timer className="h-3 w-3" />
                      {exercise.reps} reps
                    </div>
                  ) : exercise.duration && (
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                      <Timer className="h-3 w-3" />
                      {exercise.duration} s
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <Weight className="h-3 w-3" />
                    {exercise.weight} kg
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartEdit(exercise)}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 select-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartRemove}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Remove</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Section - Responsive Layout */}
        {(exercise.imageUrl || exercise.gifUrl) && (
          <div className="flex flex-col gap-4 items-start">
            <div className="w-full flex justify-center">
              <div className="relative aspect-video bg-white rounded-lg overflow-hidden w-full max-w-[300px] select-none">
                <Image
                  src={exercise.imageUrl || exercise.gifUrl || ''}
                  alt={exercise.name}
                  fill
                  loading="lazy"
                  className="object-contain pointer-events-none"
                  sizes="(max-width: 768px) 100vw, 300px"
                  draggable={false}
                  style={{ userSelect: 'none' }}
                />
              </div>
            </div>
            {exercise.notes && (
              <div className="text-sm text-gray-600 dark:text-gray-400 w-full select-none">
                <strong>Notes:</strong> {exercise.notes}
              </div>
            )}
            <Button
              variant={isCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleComplete(exercise.id)}
              className="w-full"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {isCompleted ? 'Done' : 'Complete'}
            </Button>
          </div>
        )}

        {/* Notes Section (when no image) */}
        {!exercise.imageUrl && !exercise.gifUrl && exercise.notes && (
          <div className="text-sm text-gray-600 dark:text-gray-400 select-none">
            <strong>Notes:</strong> {exercise.notes}
          </div>
        )}

        {/* Edit Form */}
        {editingExercise === exercise.id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label htmlFor={`sets-${exercise.id}`}>Sets</Label>
              <Input
                id={`sets-${exercise.id}`}
                type="number"
                value={editForm.sets || ''}
                onChange={(e) => onEditFormChange({ ...editForm, sets: Number(e.target.value) })}
              />
              <div className="text-xs text-red-500 mt-1" data-error-for={`sets-${exercise.id}`}></div>
            </div>
            {exercise.reps ? (
              <div>
                <Label htmlFor={`reps-${exercise.id}`}>Reps</Label>
                <Input
                  id={`reps-${exercise.id}`}
                  type="number"
                  value={editForm.reps || ''}
                  onChange={(e) => onEditFormChange({ ...editForm, reps: Number(e.target.value) })}
                />
                <div className="text-xs text-red-500 mt-1" data-error-for={`reps-${exercise.id}`}></div>
              </div>
            ) : exercise.duration && (
              <div>
                <Label htmlFor={`duration-${exercise.id}`}>Duration (s)</Label>
                <Input
                  id={`duration-${exercise.id}`}
                  type="number"
                  value={editForm.duration || ''}
                  onChange={(e) => onEditFormChange({ ...editForm, duration: Number(e.target.value) })}
                />
                <div className="text-xs text-red-500 mt-1" data-error-for={`duration-${exercise.id}`}></div>
              </div>
            )}
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={editForm.weight || ''}
                onChange={(e) => onEditFormChange({ ...editForm, weight: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes || ''}
                onChange={(e) => onEditFormChange({ ...editForm, notes: e.target.value })}
                placeholder="Add notes about this exercise..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <Button variant="outline" onClick={onCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={onSaveEdit}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Remove Confirmation */}
        {isRemoving && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600 mb-4 text-center font-semibold">Are you sure you want to remove this exercise?</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={onCancelRemove}
               style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => onRemove(exercise.id)}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface WorkoutDayProps {
  isExerciseLibraryOpen: boolean;
  setIsExerciseLibraryOpen: Dispatch<SetStateAction<boolean>>;
}

export function WorkoutDay({ isExerciseLibraryOpen, setIsExerciseLibraryOpen }: WorkoutDayProps) {
  const {
    template,
    weeklyData,
    selectedDay,
    removeExerciseFromDay,
    updateExercise,
    reorderExercises,
    toggleExerciseComplete,
    markDayComplete,
    isLoading,
    getCurrentDayLog
  } = useWorkoutStore();

  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [removingExercise, setRemovingExercise] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkoutExercise>>({});
  const [formErrors, setFormErrors] = useState<{
    sets?: string;
    reps?: string;
    duration?: string;
  }>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Increased for better mobile handling
        delay: 100,   // Add delay to prevent accidental drags
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Prevent text selection during drag operations
  useEffect(() => {
    if (activeId) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      // Prevent scrolling during drag on mobile
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [activeId]);

  // Auto-scroll functionality for mobile
  useEffect(() => {
    if (!activeId || !scrollContainerRef.current) return;

    let autoScrollInterval: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const relativeY = clientY - rect.top;

      const scrollThreshold = 60; // pixels from edge to trigger scroll
      const scrollSpeed = 8;

      clearInterval(autoScrollInterval);

      if (relativeY < scrollThreshold) {
        // Scroll up
        autoScrollInterval = setInterval(() => {
          container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
        }, 16);
      } else if (relativeY > rect.height - scrollThreshold) {
        // Scroll down
        autoScrollInterval = setInterval(() => {
          container.scrollTop = Math.min(
            container.scrollHeight - container.clientHeight,
            container.scrollTop + scrollSpeed
          );
        }, 16);
      }
    };

    const handleEnd = () => {
      clearInterval(autoScrollInterval);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      clearInterval(autoScrollInterval);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [activeId]);

  const dayName = DAYS[selectedDay].toLowerCase() as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  const dayTemplate = template?.[dayName];
  const exercises = dayTemplate?.exercises || [];
  const currentDayLog = getCurrentDayLog();
  const completedExercises = currentDayLog?.exercises.filter(e => e.completed).length || 0;

  const startEdit = (exercise: WorkoutExercise) => {
    // If clicking Edit on the currently edited exercise, cancel the edit
    if (editingExercise === exercise.id) {
      setEditingExercise(null);
      setEditForm({});
      return;
    }

    // Close remove confirmation if it's open
    if (removingExercise === exercise.id) {
      setRemovingExercise(null);
    }

    // Otherwise, start editing the clicked exercise
    setEditingExercise(exercise.id);
    setEditForm({
      sets: exercise.sets,
      reps: exercise.reps,
      duration: exercise.duration,
      weight: exercise.weight,
      notes: exercise.notes,
    });
  };

  const saveEdit = () => {
    if (!editingExercise) return;

    // Validate required fields
    const errors: { [key: string]: string } = {};
    
    if (!editForm.sets || editForm.sets <= 0) {
      errors.sets = "Sets cannot be empty";
    }

    const exercise = exercises.find(e => e.id === editingExercise);
    if (exercise?.reps && (!editForm.reps || editForm.reps <= 0)) {
      errors.reps = "Reps cannot be empty";
    }
    if (exercise?.duration && (!editForm.duration || editForm.duration <= 0)) {
      errors.duration = "Duration cannot be empty";
    }

    // Update error states on inputs and error messages
    const setsInput = document.querySelector(`#sets-${editingExercise}`) as HTMLInputElement;
    const repsInput = document.querySelector(`#reps-${editingExercise}`) as HTMLInputElement;
    const durationInput = document.querySelector(`#duration-${editingExercise}`) as HTMLInputElement;
    const setsError = document.querySelector(`[data-error-for="sets-${editingExercise}"]`);
    const repsError = document.querySelector(`[data-error-for="reps-${editingExercise}"]`);
    const durationError = document.querySelector(`[data-error-for="duration-${editingExercise}"]`);

    if (setsInput && setsError) {
      setsInput.style.borderColor = errors.sets ? 'rgb(239 68 68)' : '';
      setsError.textContent = errors.sets || '';
    }
    if (repsInput && repsError) {
      repsInput.style.borderColor = errors.reps ? 'rgb(239 68 68)' : '';
      repsError.textContent = errors.reps || '';
    }
    if (durationInput && durationError) {
      durationInput.style.borderColor = errors.duration ? 'rgb(239 68 68)' : '';
      durationError.textContent = errors.duration || '';
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    updateExercise(selectedDay, editingExercise, editForm);
    setEditingExercise(null);
    setEditForm({});
    toast.success('Exercise updated');
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setEditForm({});
  };

  const removeExercise = (exerciseId: string) => {
    removeExerciseFromDay(selectedDay, exerciseId);
    toast.success('Exercise removed');
  };

  const toggleComplete = (exerciseId: string) => {
    toggleExerciseComplete(selectedDay, exerciseId);
  };

  const markDayCompleted = () => {
    markDayComplete(selectedDay);
    toast.success(
      currentDayLog?.completed ? 'Day marked as incomplete' : 'Day completed!'
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || !active) {
      setDropPosition(null);
      return;
    }

    const activeIndex = exercises.findIndex(exercise => exercise.id === active.id);
    const overIndex = exercises.findIndex(exercise => exercise.id === over.id);

    if (activeIndex === -1 || overIndex === -1) {
      setDropPosition(null);
      return;
    }

    // Calculate drop position based on drag direction
    let newPosition;
    if (activeIndex < overIndex) {
      // Dragging down: position after the over item
      newPosition = overIndex + 1;
    } else {
      // Dragging up: position before the over item
      newPosition = overIndex;
    }

    setDropPosition(newPosition);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = exercises.findIndex((exercise) => exercise.id === active.id);
      const newIndex = exercises.findIndex((exercise) => exercise.id === over?.id);

      const newOrder = arrayMove(exercises, oldIndex, newIndex);
      const exerciseIds = newOrder.map(exercise => exercise.id);

      reorderExercises(selectedDay, exerciseIds);
      toast.success('Exercise order updated');
    }

    setActiveId(null);
    setDropPosition(null);
  };

  const activeExercise = activeId ? exercises.find(exercise => exercise.id === activeId) : null;

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
    <Card className="w-full">
      <CardHeader>
        {/* Responsive Header - Stack on Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-xl sm:text-2xl font-bold">
            {DAYS[selectedDay]} Workout
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {completedExercises}/{exercises.length} completed
            </Badge>
            {exercises.length > 0 && (
              <Button
                variant={currentDayLog?.completed ? "default" : "outline"}
                size="sm"
                onClick={markDayCompleted}
                className="w-full sm:w-auto"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {currentDayLog?.completed ? 'Completed' : 'Mark Day Complete'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent
        ref={scrollContainerRef}
        className="touch-pan-y"
        style={{
          touchAction: activeId ? 'none' : 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="space-y-4">
          {exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No exercises added yet.</p>
              <p className="text-sm">Click the button below to add workouts.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              autoScroll={{
                enabled: true,
                threshold: {
                  x: 0.2,
                  y: 0.2,
                },
                acceleration: 10,
              }}
            >
              <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {/* Drop line before first exercise */}
                  {dropPosition === 0 && (
                    <div className="h-1 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-blue-500 rounded-full shadow-lg"></div>
                    </div>
                  )}

                  <AnimatePresence>
                    {exercises.map((exercise, index) => {
                      const logExercise = currentDayLog?.exercises.find((e: any) => e.id === exercise.id);
                      const isCompleted = logExercise?.completed || false;

                      return (
                        <div key={exercise.id}>
                          <SortableExerciseItem
                            exercise={exercise}
                            index={index}
                            isCompleted={isCompleted}
                            editingExercise={editingExercise}
                            editForm={editForm}
                            formErrors={formErrors}
                            onStartEdit={startEdit}
                            onSaveEdit={saveEdit}
                            onCancelEdit={cancelEdit}
                            onToggleComplete={toggleComplete}
                            onEditFormChange={setEditForm}
                            onFormErrorChange={setFormErrors}
                            onRemove={removeExercise}
                            isRemoving={removingExercise === exercise.id}
                            onStartRemove={() => {
                              setRemovingExercise(exercise.id);
                              if (editingExercise === exercise.id) {
                                setEditingExercise(null);
                                setEditForm({});
                              }
                            }}
                            onCancelRemove={() => setRemovingExercise(null)}
                          />

                          {/* Drop line after this exercise */}
                          {dropPosition === index + 1 && (
                            <div className="h-1 flex items-center justify-center mt-4">
                              <div className="w-full h-0.5 bg-blue-500 rounded-full shadow-lg"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add Exercise Button */}
          <Button
            className="w-full h-12 mt-4"
            variant="outline"
            onClick={() => setIsExerciseLibraryOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Exercise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}