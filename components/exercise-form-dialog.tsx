'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Exercise } from '@/lib/exercisedb';
import { X } from 'lucide-react';

interface ExerciseFormDialogProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exerciseDetails: {
    id: string;
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    duration?: number;
    notes: string;
    completed: boolean;
    imageUrl?: string;
    gifUrl?: string;
  }) => void;
}

export function ExerciseFormDialog({ exercise, isOpen, onClose, onAdd }: ExerciseFormDialogProps) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'reps' | 'duration'>('reps');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      sets,
      reps: type === 'reps' ? reps : 0,
      weight,
      duration: type === 'duration' ? duration : undefined,
      notes,
      completed: false,
      imageUrl: exercise.imageUrl,
      gifUrl: exercise.gifUrl,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex items-center justify-between border-b pb-4">
          <DialogHeader>
            <DialogTitle>Add Exercise Details</DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{exercise.name}</h4>
            <div className="text-xs text-muted-foreground">
              Target: {exercise.target}
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <>, {exercise.secondaryMuscles.join(', ')}</>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min={1}
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: 'reps' | 'duration') => setType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reps">Repetitions</SelectItem>
                  <SelectItem value="duration">Duration (sec)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'reps' ? (
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min={1}
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (sec)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={0}
                step={0.5}
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this exercise..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Exercise</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 