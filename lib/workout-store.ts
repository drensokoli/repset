import { create } from 'zustand';

// Exercise interfaces
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  duration?: number;
  notes: string;
  imageUrl?: string;
  gifUrl?: string;
  order: number;
}

export interface DayTemplate {
  exercises: WorkoutExercise[];
  updatedAt: string;
}

// Timeline-based template system
export interface TemplateTimeRange {
  userId: string;
  templateId: string;        // Unique identifier
  name?: string;            // "Holiday Routine", "Bulk Phase", etc.
  startWeekId: string;      // "2024-W15" - when this template starts
  endWeekId?: string;       // "2024-W25" - when it ends (null = indefinite)
  isActive: boolean;        // For current active template
  
  // Template data
  monday: DayTemplate;
  tuesday: DayTemplate;
  wednesday: DayTemplate;
  thursday: DayTemplate;
  friday: DayTemplate;
  saturday: DayTemplate;
  sunday: DayTemplate;
  
  createdAt: string;
  updatedAt: string;
}

// Legacy interface for backward compatibility with UI
export interface WorkoutTemplate {
  userId: string;
  monday: DayTemplate;
  tuesday: DayTemplate;
  wednesday: DayTemplate;
  thursday: DayTemplate;
  friday: DayTemplate;
  saturday: DayTemplate;
  sunday: DayTemplate;
  createdAt: string;
  updatedAt: string;
}

// Individual day workout log with weekId for efficient weekly queries
export interface DayWorkoutLog {
  userId: string;
  date: string; // "YYYY-MM-DD"
  weekId: string; // "YYYY-WW" format 
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  exercises: Array<WorkoutExercise & { completed: boolean }>;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Collection of day logs for a week (used in UI state)
export interface WeeklyWorkoutData {
  [dayIndex: string]: DayWorkoutLog; // "0" through "6" (Sunday=0)
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Utility functions for week handling
export const getWeekId = (date: Date): string => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

export const getWeekStartDate = (date: Date): string => {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = date.getDate() - day;
  const weekStart = new Date(date.setDate(diff));
  return weekStart.toISOString().split('T')[0];
};

export const getDayIndex = (date: Date): number => {
  return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
};

export const getDateFromWeekAndDay = (weekStartDate: string, dayIndex: number): string => {
  const start = new Date(weekStartDate);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + dayIndex);
  return targetDate.toISOString().split('T')[0];
};

// Timeline template utilities
export const generateTemplateId = (): string => {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getPreviousWeek = (weekId: string): string => {
  const [year, week] = weekId.split('-W').map(Number);
  const prevWeek = week - 1;
  if (prevWeek < 1) {
    return `${year - 1}-W52`; // Assuming 52 weeks per year
  }
  return `${year}-W${prevWeek.toString().padStart(2, '0')}`;
};

export const getNextWeek = (weekId: string): string => {
  const [year, week] = weekId.split('-W').map(Number);
  const nextWeek = week + 1;
  if (nextWeek > 52) {
    return `${year + 1}-W01`;
  }
  return `${year}-W${nextWeek.toString().padStart(2, '0')}`;
};

export const compareWeekIds = (weekId1: string, weekId2: string): number => {
  const [year1, week1] = weekId1.split('-W').map(Number);
  const [year2, week2] = weekId2.split('-W').map(Number);
  
  if (year1 !== year2) return year1 - year2;
  return week1 - week2;
};

const saveTemplateRangeToDb = async (templateRange: TemplateTimeRange) => {
  try {
    const response = await fetch('/api/template-ranges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateRange),
    });

    if (!response.ok) {
      throw new Error('Failed to save template range');
    }
    
    const result = await response.json();
    return result.templateRange;
  } catch (error) {
    console.error('Error saving template range:', error);
    throw error;
  }
};

const fetchTemplateForWeek = async (weekId: string): Promise<WorkoutTemplate | null> => {
  try {
    const response = await fetch(`/api/template-ranges?weekId=${weekId}`);
    if (!response.ok) {
      return null;
    }
    
    const templateRange = await response.json();
    if (!templateRange) return null;
    
    // Convert TemplateTimeRange to WorkoutTemplate for UI compatibility
    const workoutTemplate: WorkoutTemplate = {
      userId: templateRange.userId,
      monday: templateRange.monday,
      tuesday: templateRange.tuesday,
      wednesday: templateRange.wednesday,
      thursday: templateRange.thursday,
      friday: templateRange.friday,
      saturday: templateRange.saturday,
      sunday: templateRange.sunday,
      createdAt: templateRange.createdAt,
      updatedAt: templateRange.updatedAt,
    };
    
    return workoutTemplate;
  } catch (error) {
    console.error('Error fetching template for week:', error);
    return null;
  }
};

const fetchAllTemplateRanges = async (): Promise<TemplateTimeRange[]> => {
  try {
    const response = await fetch('/api/template-ranges');
    if (!response.ok) {
      return [];
    }
    
    const ranges = await response.json();
    return ranges || [];
  } catch (error) {
    console.error('Error fetching template ranges:', error);
    return [];
  }
};

// Legacy function for backward compatibility
const saveTemplateToDb = async (template: Partial<WorkoutTemplate>) => {
  console.warn('saveTemplateToDb is deprecated, template creation is handled internally by the store');
};

const saveDayLogToDb = async (dayLog: DayWorkoutLog) => {
  try {
    const response = await fetch('/api/day-workout-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dayLog),
    });

    if (!response.ok) {
      throw new Error('Failed to save day log');
    }
    
    const result = await response.json();
    return result.dayLog;
  } catch (error) {
    console.error('Error saving day log:', error);
    throw error;
  }
};

interface WorkoutStore {
  template: WorkoutTemplate | null;
  weeklyData: WeeklyWorkoutData | null;
  selectedDay: number;
  currentWeekId: string;
  isLoading: boolean;
  setTemplate: (template: WorkoutTemplate) => void;
  setWeeklyData: (data: WeeklyWorkoutData) => void;
  setSelectedDay: (day: number) => void;
  setCurrentWeek: (date: Date) => void;
  addExerciseToDay: (day: number, exercise: WorkoutExercise) => Promise<void>;
  removeExerciseFromDay: (day: number, exerciseId: string) => Promise<void>;
  updateExercise: (day: number, exerciseId: string, updates: Partial<WorkoutExercise>) => Promise<void>;
  reorderExercises: (day: number, exerciseIds: string[]) => Promise<void>;
  toggleExerciseComplete: (day: number, exerciseId: string) => Promise<void>;
  markDayComplete: (day: number) => Promise<void>;
  fetchWeeklyWorkoutData: (date: Date) => Promise<void>;
  // Legacy method for backward compatibility
  fetchWorkoutData: (date: string) => Promise<void>;
  // Helper methods for UI compatibility
  getCurrentDayLog: () => DayWorkoutLog | null;
}

export const useWorkoutStore = create<WorkoutStore>()((set, get) => {
  // Helper functions inside store scope
  const createNewTemplateRange = async (
    startWeekId: string, 
    templateData: Partial<WorkoutTemplate>,
    name?: string
  ): Promise<TemplateTimeRange> => {
    const now = new Date().toISOString();
    
    const templateRange: TemplateTimeRange = {
      userId: templateData.userId || 'placeholder',
      templateId: generateTemplateId(),
      name: name || `Template from ${startWeekId}`,
      startWeekId,
      endWeekId: undefined, // Indefinite
      isActive: true,
      monday: templateData.monday || { exercises: [], updatedAt: now },
      tuesday: templateData.tuesday || { exercises: [], updatedAt: now },
      wednesday: templateData.wednesday || { exercises: [], updatedAt: now },
      thursday: templateData.thursday || { exercises: [], updatedAt: now },
      friday: templateData.friday || { exercises: [], updatedAt: now },
      saturday: templateData.saturday || { exercises: [], updatedAt: now },
      sunday: templateData.sunday || { exercises: [], updatedAt: now },
      createdAt: templateData.createdAt || now,
      updatedAt: now,
    };
    
    return await saveTemplateRangeToDb(templateRange);
  };

  const updateExistingTemplateRange = async (
    existingRange: TemplateTimeRange,
    templateData: Partial<WorkoutTemplate>
  ): Promise<TemplateTimeRange> => {
    const now = new Date().toISOString();
    
    const updatedRange: TemplateTimeRange = {
      ...existingRange,
      monday: templateData.monday || existingRange.monday,
      tuesday: templateData.tuesday || existingRange.tuesday,
      wednesday: templateData.wednesday || existingRange.wednesday,
      thursday: templateData.thursday || existingRange.thursday,
      friday: templateData.friday || existingRange.friday,
      saturday: templateData.saturday || existingRange.saturday,
      sunday: templateData.sunday || existingRange.sunday,
      updatedAt: now,
    };
    
    return await saveTemplateRangeToDb(updatedRange);
  };

  const findTemplateRangeStartingAtWeek = async (weekId: string): Promise<TemplateTimeRange | null> => {
    try {
      const allRanges = await fetchAllTemplateRanges();
      return allRanges.find(range => range.startWeekId === weekId) || null;
    } catch (error) {
      console.error('Error finding template range starting at week:', error);
      return null;
    }
  };

  const updateTemplateForCurrentWeek = async (templateData: Partial<WorkoutTemplate>) => {
    const currentWeekId = get().currentWeekId;
    
    // Check if there's already a template range starting at the current week
    const existingRange = await findTemplateRangeStartingAtWeek(currentWeekId);
    
    if (existingRange) {
      // Update the existing range
      console.log(`Updating existing template range for week ${currentWeekId}`);
      await updateExistingTemplateRange(existingRange, templateData);
    } else {
      // Create a new range starting from current week
      console.log(`Creating new template range for week ${currentWeekId}`);
      await createNewTemplateRange(currentWeekId, templateData, `Updated Template from ${currentWeekId}`);
    }
    
    // Fetch the updated template for the current week
    const refreshedTemplate = await fetchTemplateForWeek(currentWeekId);
    set({ template: refreshedTemplate });
  };

  return {
    template: null,
    weeklyData: null,
    selectedDay: new Date().getDay(),
    currentWeekId: getWeekId(new Date()),
    isLoading: false,
    
    setTemplate: (template) => set({ template }),
    setWeeklyData: (weeklyData) => set({ weeklyData }),
    setSelectedDay: (day) => set({ selectedDay: day }),
    setCurrentWeek: (date) => set({ currentWeekId: getWeekId(date) }),
  
  fetchWeeklyWorkoutData: async (date: Date) => {
    set({ isLoading: true });
    try {
      const weekId = getWeekId(date);
      const weekStartDate = getWeekStartDate(new Date(date));
      
      // Fetch template for this specific week using timeline system
      const template = await fetchTemplateForWeek(weekId);
      
      // Fetch all day logs for the week
      const dayLogsResponse = await fetch(`/api/day-workout-logs?weekId=${weekId}`);
      let dayLogs: DayWorkoutLog[] = [];
      
      if (dayLogsResponse.ok) {
        dayLogs = await dayLogsResponse.json();
      }
      
      // Convert day logs array to WeeklyWorkoutData object
      const weeklyData: WeeklyWorkoutData = {};
      
      // Initialize all days for the week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = DAYS[dayIndex];
        const dayDate = getDateFromWeekAndDay(weekStartDate, dayIndex);
        
        // Check if we have existing data for this day
        const existingDayLog = dayLogs.find(log => log.date === dayDate);
        
        if (existingDayLog) {
          weeklyData[dayIndex.toString()] = existingDayLog;
        } else if (template) {
          // Create new day log from template
          const newDayLog: DayWorkoutLog = {
            userId: 'placeholder', // Will be set by server
            date: dayDate,
            weekId,
            dayOfWeek: dayIndex,
            exercises: template[dayName]?.exercises.map((exercise: WorkoutExercise) => ({
              ...exercise,
              completed: false
            })) || [],
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          weeklyData[dayIndex.toString()] = newDayLog;
        }
      }
      
      set({ 
        template: template || null,
        weeklyData,
        currentWeekId: weekId
      });
    } catch (error) {
      console.error('Error fetching weekly workout data:', error);
      set({ template: null, weeklyData: null });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addExerciseToDay: async (day, exercise) => {
    const state = get();
    if (!state.template) {
      // Create new template if none exists
      const now = new Date().toISOString();
      const newTemplate: WorkoutTemplate = {
        userId: 'placeholder', // Will be set by server
        monday: { exercises: [], updatedAt: now },
        tuesday: { exercises: [], updatedAt: now },
        wednesday: { exercises: [], updatedAt: now },
        thursday: { exercises: [], updatedAt: now },
        friday: { exercises: [], updatedAt: now },
        saturday: { exercises: [], updatedAt: now },
        sunday: { exercises: [], updatedAt: now },
        createdAt: now,
        updatedAt: now,
      };
      
      const dayName = DAYS[day];
      newTemplate[dayName].exercises.push({
        ...exercise,
        order: 0
      });
      newTemplate[dayName].updatedAt = new Date().toISOString();
      
      await updateTemplateForCurrentWeek(newTemplate);
      return;
    }
    
    const dayName = DAYS[day];
    const updatedTemplate = { ...state.template };
    updatedTemplate[dayName] = {
      ...updatedTemplate[dayName],
      exercises: [...updatedTemplate[dayName].exercises, {
        ...exercise,
        order: updatedTemplate[dayName].exercises.length
      }],
      updatedAt: new Date().toISOString()
    };
    updatedTemplate.updatedAt = new Date().toISOString();
    
    await updateTemplateForCurrentWeek(updatedTemplate);
    
    // If there's weekly data, update the specific day
    if (state.weeklyData) {
      const updatedWeeklyData = { ...state.weeklyData };
      const dayStr = day.toString();
      
      if (updatedWeeklyData[dayStr]) {
        const updatedDayLog = { 
          ...updatedWeeklyData[dayStr],
          exercises: [...updatedWeeklyData[dayStr].exercises, { ...exercise, completed: false }],
          updatedAt: new Date().toISOString()
        };
        
        const savedDayLog = await saveDayLogToDb(updatedDayLog);
        updatedWeeklyData[dayStr] = savedDayLog;
        set({ weeklyData: updatedWeeklyData });
      }
    }
  },
  
  removeExerciseFromDay: async (day, exerciseId) => {
    const state = get();
    if (!state.template) return;
    
    const dayName = DAYS[day];
    const updatedTemplate = { ...state.template };
    updatedTemplate[dayName] = {
      ...updatedTemplate[dayName],
      exercises: updatedTemplate[dayName].exercises.filter(e => e.id !== exerciseId),
      updatedAt: new Date().toISOString()
    };
    updatedTemplate.updatedAt = new Date().toISOString();
    
    await updateTemplateForCurrentWeek(updatedTemplate);
    
    // If there's weekly data, update the specific day
    if (state.weeklyData) {
      const updatedWeeklyData = { ...state.weeklyData };
      const dayStr = day.toString();
      
      if (updatedWeeklyData[dayStr]) {
        const updatedDayLog = { 
          ...updatedWeeklyData[dayStr],
          exercises: updatedWeeklyData[dayStr].exercises.filter(e => e.id !== exerciseId),
          updatedAt: new Date().toISOString()
        };
        
        const savedDayLog = await saveDayLogToDb(updatedDayLog);
        updatedWeeklyData[dayStr] = savedDayLog;
        set({ weeklyData: updatedWeeklyData });
      }
    }
  },
  
  updateExercise: async (day, exerciseId, updates) => {
    const state = get();
    if (!state.template) return;
    
    const dayName = DAYS[day];
    const updatedTemplate = { ...state.template };
    const exerciseIndex = updatedTemplate[dayName].exercises.findIndex(e => e.id === exerciseId);
    
    if (exerciseIndex !== -1) {
      updatedTemplate[dayName] = {
        ...updatedTemplate[dayName],
        exercises: updatedTemplate[dayName].exercises.map((exercise, index) => 
          index === exerciseIndex ? { ...exercise, ...updates } : exercise
        ),
        updatedAt: new Date().toISOString()
      };
      updatedTemplate.updatedAt = new Date().toISOString();
      
      await updateTemplateForCurrentWeek(updatedTemplate);
      
      // If there's weekly data, update the specific day
      if (state.weeklyData) {
        const updatedWeeklyData = { ...state.weeklyData };
        const dayStr = day.toString();
        
        if (updatedWeeklyData[dayStr]) {
          const logExerciseIndex = updatedWeeklyData[dayStr].exercises.findIndex(e => e.id === exerciseId);
          if (logExerciseIndex !== -1) {
            const updatedDayLog = { 
              ...updatedWeeklyData[dayStr],
              exercises: updatedWeeklyData[dayStr].exercises.map((exercise, index) => 
                index === logExerciseIndex ? { ...exercise, ...updates } : exercise
              ),
              updatedAt: new Date().toISOString()
            };
            
            const savedDayLog = await saveDayLogToDb(updatedDayLog);
            updatedWeeklyData[dayStr] = savedDayLog;
            set({ weeklyData: updatedWeeklyData });
          }
        }
      }
    }
  },

  reorderExercises: async (day, exerciseIds) => {
    const state = get();
    if (!state.template) return;
    
    const dayName = DAYS[day];
    const updatedTemplate = { ...state.template };
    const currentExercises = updatedTemplate[dayName].exercises;
    
    // Reorder exercises based on the new order of IDs
    const reorderedExercises = exerciseIds.map(id => {
      const exercise = currentExercises.find(e => e.id === id);
      return exercise;
    }).filter(Boolean) as WorkoutExercise[]; // Filter out any undefined values
    
    // Update the order property for each exercise
    const exercisesWithUpdatedOrder = reorderedExercises.map((exercise, index) => ({
      ...exercise,
      order: index
    }));
    
    updatedTemplate[dayName] = {
      ...updatedTemplate[dayName],
      exercises: exercisesWithUpdatedOrder,
      updatedAt: new Date().toISOString()
    };
    updatedTemplate.updatedAt = new Date().toISOString();
    
    await updateTemplateForCurrentWeek(updatedTemplate);
    
    // If there's weekly data, update the specific day with reordered exercises
    if (state.weeklyData) {
      const updatedWeeklyData = { ...state.weeklyData };
      const dayStr = day.toString();
      
      if (updatedWeeklyData[dayStr]) {
        const currentDayLog = updatedWeeklyData[dayStr];
        
        // Reorder day log exercises to match template order
        const reorderedLogExercises = exerciseIds.map(id => {
          return currentDayLog.exercises.find(e => e.id === id);
        }).filter(Boolean) as any[]; // Filter out any undefined values
        
        const updatedDayLog = { 
          ...currentDayLog,
          exercises: reorderedLogExercises,
          updatedAt: new Date().toISOString()
        };
        
        const savedDayLog = await saveDayLogToDb(updatedDayLog);
        updatedWeeklyData[dayStr] = savedDayLog;
        set({ weeklyData: updatedWeeklyData });
      }
    }
  },
  
  toggleExerciseComplete: async (day, exerciseId) => {
    const state = get();
    const now = new Date().toISOString();
    const dayName = DAYS[day];
    const dayStr = day.toString();

    // Create a new day log if one doesn't exist
    if (!state.weeklyData || !state.weeklyData[dayStr]) {
      if (!state.template) return; // Can't create log without template
      
      const weekId = state.currentWeekId;
      const weekStartDate = getWeekStartDate(new Date());
      const dayDate = getDateFromWeekAndDay(weekStartDate, day);
      
      const newDayLog: DayWorkoutLog = {
        userId: 'placeholder', // Will be set by server
        date: dayDate,
        weekId,
        dayOfWeek: day,
        exercises: state.template[dayName].exercises.map((exercise: WorkoutExercise) => ({
          ...exercise,
          completed: exercise.id === exerciseId // Only mark the clicked exercise as completed
        })),
        completed: false,
        createdAt: now,
        updatedAt: now
      };
      
      const savedDayLog = await saveDayLogToDb(newDayLog);
      const updatedWeeklyData = { ...state.weeklyData || {} };
      updatedWeeklyData[dayStr] = savedDayLog;
      set({ weeklyData: updatedWeeklyData });
      return;
    }
    
    // Update existing day log
    const updatedWeeklyData = { ...state.weeklyData };
    const updatedDayLog = { ...updatedWeeklyData[dayStr] };
    
    // Toggle the specific exercise
    const exercise = updatedDayLog.exercises.find(e => e.id === exerciseId);
    if (exercise) {
      exercise.completed = !exercise.completed;
    } else {
      // If the exercise exists in template but not in log, add it
      const templateExercise = state.template?.[dayName].exercises.find(e => e.id === exerciseId);
      if (templateExercise) {
        updatedDayLog.exercises.push({
          ...templateExercise,
          completed: true // Mark as completed since that's what was requested
        });
      }
    }
    
    updatedDayLog.updatedAt = now;
    const savedDayLog = await saveDayLogToDb(updatedDayLog);
    updatedWeeklyData[dayStr] = savedDayLog;
    set({ weeklyData: updatedWeeklyData });
  },
  
  markDayComplete: async (day) => {
    const state = get();
    const now = new Date().toISOString();
    const dayName = DAYS[day];
    const dayStr = day.toString();
    
    // Create a new day log if one doesn't exist
    if (!state.weeklyData || !state.weeklyData[dayStr]) {
      if (!state.template) return; // Can't create log without template
      
      const weekId = state.currentWeekId;
      const weekStartDate = getWeekStartDate(new Date());
      const dayDate = getDateFromWeekAndDay(weekStartDate, day);
      
      const newDayLog: DayWorkoutLog = {
        userId: 'placeholder', // Will be set by server
        date: dayDate,
        weekId,
        dayOfWeek: day,
        exercises: state.template[dayName].exercises.map(exercise => ({
          ...exercise,
          completed: false
        })),
        completed: true, // Start as completed since we're marking it complete
        createdAt: now,
        updatedAt: now
      };
      
      const savedDayLog = await saveDayLogToDb(newDayLog);
      const updatedWeeklyData = { ...state.weeklyData || {} };
      updatedWeeklyData[dayStr] = savedDayLog;
      set({ weeklyData: updatedWeeklyData });
      return;
    }
    
    // Update existing day log
    const updatedWeeklyData = { ...state.weeklyData };
    const updatedDayLog = { ...updatedWeeklyData[dayStr] };
    
    // Toggle day completion
    updatedDayLog.completed = !updatedDayLog.completed;
    updatedDayLog.updatedAt = now;
    
    const savedDayLog = await saveDayLogToDb(updatedDayLog);
    updatedWeeklyData[dayStr] = savedDayLog;
    set({ weeklyData: updatedWeeklyData });
  },
  
  // Legacy method for backward compatibility
  fetchWorkoutData: async (date: string) => {
    const targetDate = new Date(date);
    await get().fetchWeeklyWorkoutData(targetDate);
  },
  
  // Helper method to get current day log for UI compatibility
  getCurrentDayLog: () => {
    const state = get();
    if (!state.weeklyData) return null;
    
      const dayStr = state.selectedDay.toString();
      return state.weeklyData[dayStr] || null;
    }
  };
}); 