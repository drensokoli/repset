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
  Loader2
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
  onStartEdit: (exercise: WorkoutExercise) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (exerciseId: string) => void;
  onToggleComplete: (exerciseId: string) => void;
  onEditFormChange: (updates: Partial<WorkoutExercise>) => void;
}

function SortableExerciseItem({
  exercise,
  index,
  isCompleted,
  editingExercise,
  editForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onToggleComplete,
  onEditFormChange,
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
      className={`border rounded-lg p-4 transition-all duration-200 ${
        isDragging
          ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
          : isCompleted 
            ? 'border-green-200 dark:border-green-800 border-2' 
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

          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => onToggleComplete(exercise.id)}
              aria-label="Toggle exercise completion"
              className="select-none"
            />
          </div>

          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold text-sm sm:text-base break-words ${isCompleted ? 'text-gray-500' : ''}`}>
                  {exercise.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <Target className="h-3 w-3" />
                    {exercise.sets} sets
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <Timer className="h-3 w-3" />
                    {exercise.reps} reps
                  </div>
                  {exercise.weight && (
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                      <Weight className="h-3 w-3" />
                      {exercise.weight} kg
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartEdit(exercise)}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:ml-2 sm:inline">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(exercise.id)}
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
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={editForm.sets || ''}
                onChange={(e) => onEditFormChange({ ...editForm, sets: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={editForm.reps || ''}
                onChange={(e) => onEditFormChange({ ...editForm, reps: Number(e.target.value) })}
              />
            </div>
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
  const [editForm, setEditForm] = useState<Partial<WorkoutExercise>>({});
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
    setEditingExercise(exercise.id);
    setEditForm({
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      notes: exercise.notes,
    });
  };

  const saveEdit = () => {
    if (!editingExercise) return;
    
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
                <span className="hidden sm:inline">
                  {currentDayLog?.completed ? 'Completed' : 'Mark Complete'}
                </span>
                <span className="sm:hidden">
                  {currentDayLog?.completed ? 'Done' : 'Complete'}
                </span>
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
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                            onStartEdit={startEdit}
                            onSaveEdit={saveEdit}
                            onCancelEdit={cancelEdit}
                            onRemove={removeExercise}
                            onToggleComplete={toggleComplete}
                            onEditFormChange={setEditForm}
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
              
              <DragOverlayComponent>
                {activeExercise ? (
                  <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow-2xl border-blue-200 dark:border-blue-800 border-2 transform rotate-1 select-none max-w-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900">
                          <GripVertical className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                      <div className="flex-shrink-0 pt-1">
                        <Checkbox
                          checked={false}
                          disabled
                          aria-label="Exercise completion status"
                          className="select-none"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-sm sm:text-base break-words">
                          {activeExercise.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                            <Target className="h-3 w-3" />
                            {activeExercise.sets} sets
                          </div>
                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                            <Timer className="h-3 w-3" />
                            {activeExercise.reps} reps
                          </div>
                          {activeExercise.weight && (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                              <Weight className="h-3 w-3" />
                              {activeExercise.weight} kg
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlayComponent>
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