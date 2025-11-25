import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Workout, StrengthTest, Goal } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, X, TrendingUp, Pencil, Trash2, Save, Plus, Target, Trophy } from 'lucide-react-native';
import { convertWeight, formatWeight, convertFromLbs, convertToLbs } from '@/lib/weightUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { handleError } from '@/lib/errorHandling';
import { validateWorkout, validateExercise, getFirstError } from '@/lib/validation';
import { AdBanner } from '@/components/AdBanner';
import {
  useWorkouts,
  useCycles,
  useGoals,
  useStrengthTests,
  useScheduledTrainings,
  useUpdateWorkout,
  useDeleteWorkout,
  useCreateWorkout,
  useCreateExercises,
  useCreateScheduledTraining,
} from '@/lib/react-query-sqlite-complete';
import { getExercises, deleteExercisesByWorkout } from '@/lib/db/queries/exercises';

interface Cycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cycle_type: string;
}

interface DayData {
  date: Date;
  workoutCount: number;
  isInCycle: boolean;
  cycleName?: string;
  goalCount: number;
  strengthTestCount: number;
}

type Exercise = {
  id?: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  weight_unit?: 'lbs' | 'kg';
  notes: string;
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { profile, isPremium } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Use SQLite hooks for offline-first data
  const { data: allWorkouts = [] } = useWorkouts();
  const { data: cycles = [] } = useCycles();
  const { data: allGoals = [] } = useGoals();
  const { data: strengthTests = [] } = useStrengthTests();
  const { data: scheduledTrainings = [] } = useScheduledTrainings();
  
  // Mutations
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();
  const createWorkoutMutation = useCreateWorkout();
  const createExercisesMutation = useCreateExercises();
  const createScheduledTrainingMutation = useCreateScheduledTraining();
  
  // Filter data for current month view
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Filter workouts and goals for the current month ± 1 month
  const prevMonth = new Date(currentYear, currentMonth - 1, 1);
  const nextMonth = new Date(currentYear, currentMonth + 2, 0);
  const startDate = prevMonth.toISOString().split('T')[0];
  const endDate = nextMonth.toISOString().split('T')[0];
  
  const workouts = allWorkouts.filter(w => {
    const wDate = w.created_at.split('T')[0];
    return wDate >= startDate && wDate <= endDate;
  });
  
  const goals = allGoals.filter(g => {
    if (!g.deadline) return false;
    return g.deadline >= startDate && g.deadline <= endDate;
  });
  
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [showCycles, setShowCycles] = useState(true);
  const [showGoals, setShowGoals] = useState(true);
  const [showStrengthTests, setShowStrengthTests] = useState(true);
  
  // Edit workout modal state
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [workoutType, setWorkoutType] = useState('table_practice');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState('5');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  // Add workout modal state (for past/today dates)
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);
  const [addWorkoutType, setAddWorkoutType] = useState('table_practice');
  const [addDuration, setAddDuration] = useState('30');
  const [addIntensity, setAddIntensity] = useState('5');
  const [addWorkoutNotes, setAddWorkoutNotes] = useState('');
  const [addExercises, setAddExercises] = useState<Exercise[]>([]);
  const [addWorkoutCycleId, setAddWorkoutCycleId] = useState<string | null>(null);

  // Schedule training modal state (for future dates)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // View modal states
  const [showWorkoutViewModal, setShowWorkoutViewModal] = useState(false);
  const [showGoalViewModal, setShowGoalViewModal] = useState(false);
  const [showPRViewModal, setShowPRViewModal] = useState(false);

  // Selected items for viewing
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [viewingPR, setViewingPR] = useState<StrengthTest | null>(null);

  // Workout exercises loading for view modal
  const [viewModalExercises, setViewModalExercises] = useState<Exercise[]>([]);
  const [loadingViewExercises, setLoadingViewExercises] = useState(false);

  // Set available years based on profile
  useFocusEffect(
    useCallback(() => {
      if (profile?.created_at) {
        const registrationYear = new Date(profile.created_at).getFullYear();
        const currentYearNow = new Date().getFullYear();
        const years = [];
        for (let year = registrationYear; year <= currentYearNow + 2; year++) {
          years.push(year);
        }
        setAvailableYears(years);
      }
    }, [profile?.created_at])
  );

  const getWorkoutCountForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return workouts.filter((w) => w.created_at.split('T')[0] === dateStr).length;
  };

  const getGoalCountForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return goals.filter((g) => g.deadline === dateStr).length;
  };

  const getStrengthTestCountForDate = (date: Date): number => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return strengthTests.filter((st) => st.created_at.split('T')[0] === dateStr).length;
  };

  const getGoalsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return goals.filter((g) => g.deadline === dateStr);
  };

  const getStrengthTestsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return strengthTests.filter((st) => st.created_at.split('T')[0] === dateStr);
  };

  const getScheduledTrainingsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return scheduledTrainings.filter((t) => t.scheduled_date === dateStr);
  };

  const isDateInCycle = (date: Date): { isInCycle: boolean; cycleName?: string; cycleCount?: number; allCycles?: Cycle[] } => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const activeCycles = cycles.filter(cycle => 
      dateStr >= cycle.start_date && dateStr <= cycle.end_date
    );
    
    if (activeCycles.length > 0) {
      return { 
        isInCycle: true, 
        cycleName: activeCycles[0].name,
        cycleCount: activeCycles.length,
        allCycles: activeCycles
      };
    }
    
    return { isInCycle: false, cycleCount: 0 };
  };

  const getDayColor = (workoutCount: number, isInCycle: boolean, scheduledCount: number, strengthTestCount: number, isTodayOrFuture: boolean): string => {
    if (!showWorkouts && !showCycles && !showStrengthTests) return colors.surface;
    if (!showWorkouts && isInCycle && showCycles) return '#2A7DE144';
    if (!showCycles && workoutCount > 0 && showWorkouts) {
      if (workoutCount === 1) return '#E6394655';
      if (workoutCount === 2) return '#E6394688';
      if (workoutCount >= 3) return '#E63946';
    }

    // Show scheduled trainings for today and future (orange background)
    if (scheduledCount > 0 && isTodayOrFuture) return '#FFA50055';

    // Priority for strength tests
    if (strengthTestCount > 0 && showStrengthTests) return '#10B98155';

    if (workoutCount === 0 && !isInCycle && scheduledCount === 0 && strengthTestCount === 0) return colors.surface;
    if (isInCycle && workoutCount === 0 && showCycles) return '#2A7DE144';
    if (workoutCount === 1 && showWorkouts) return '#E6394655';
    if (workoutCount === 2 && showWorkouts) return '#E6394688';
    if (workoutCount >= 3 && showWorkouts) return '#E63946';
    return colors.surface;
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const canGoForward = () => {
    const today = new Date();
    const maxYear = today.getFullYear() + 2;
    const maxMonth = today.getMonth();

    if (currentYear > maxYear) return false;
    if (currentYear === maxYear && currentMonth >= maxMonth) return false;

    return true;
  };

  const renderCalendar = () => {
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - 40 - 24;
    const daySize = Math.floor(availableWidth / 7);
  
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
  
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headers = dayHeaders.map((dayName, index) => (
      <View
        key={`header-${index}`}
        style={[styles.dayHeader, { width: daySize }]}
      >
        <Text style={[styles.dayHeaderText, { color: colors.textSecondary }]}>
          {dayName}
        </Text>
      </View>
    ));
  
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View
          key={`empty-${i}`}
          style={[styles.day, { width: daySize, height: daySize }]}
        />
      );
    }
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);
  
      const workoutCount = getWorkoutCountForDate(date);
      const scheduledCount = getScheduledTrainingsForDate(date).length;
      const goalCount = getGoalCountForDate(date);
      const strengthTestCount = getStrengthTestCountForDate(date);
      const cycleInfo = isDateInCycle(date);
      const isFuture = date > today;
      const isTodayOrFuture = date >= today;
      const dayColor = getDayColor(workoutCount, cycleInfo.isInCycle, scheduledCount, strengthTestCount, isTodayOrFuture);
  
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
  
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.day,
            {
              width: daySize,
              height: daySize,
              backgroundColor: dayColor,
              borderWidth: cycleInfo.isInCycle && showCycles ? 2 : isToday ? 2 : 0,
              borderColor: isToday ? colors.primary : '#2A7DE1',
            },
          ]}
          onPress={() => handleDayPress(date)}
        >
          <Text
            style={[
              styles.dayText,
              { color: (workoutCount > 0 || scheduledCount > 0 || strengthTestCount > 0) ? '#FFF' : colors.text },
              (workoutCount > 0 || scheduledCount > 0 || strengthTestCount > 0) ? styles.dayTextActive : null,
              isToday && !workoutCount && !strengthTestCount ? { color: colors.primary, fontWeight: 'bold' } : null,
            ]}
          >
            {day}
          </Text>
          {cycleInfo.isInCycle && cycleInfo.cycleCount && cycleInfo.cycleCount > 1 && showCycles && (
            <View style={styles.multipleCyclesIndicator}>
              <Text style={styles.multipleCyclesText}>{cycleInfo.cycleCount}</Text>
            </View>
          )}
          {goalCount > 0 && showGoals && (
            <View style={styles.goalIndicator}>
              <Text style={styles.goalIndicatorText}>🎯</Text>
            </View>
          )}
          {strengthTestCount > 0 && showStrengthTests && (
            <View style={styles.strengthTestIndicator}>
              <Text style={styles.strengthTestIndicatorText}>💪</Text>
            </View>
          )}
          {scheduledCount > 0 && (
            <View style={styles.scheduledIndicator}>
              <Text style={styles.scheduledIndicatorText}>📅</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
  
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={styles.monthNavButton}
          >
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
  
          <Text style={[styles.monthYearTitle, { color: colors.text }]}>
            {new Date(currentYear, currentMonth).toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
  
          <TouchableOpacity
            onPress={handleNextMonth}
            disabled={!canGoForward()}
            style={styles.monthNavButton}
          >
            <ChevronRight
              size={28}
              color={canGoForward() ? colors.text : colors.border}
            />
          </TouchableOpacity>
        </View>
  
        <View style={styles.dayHeadersContainer}>{headers}</View>
        <View style={styles.daysContainer}>{days}</View>
      </View>
    );
  };

  const getWorkoutsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return workouts.filter((w) => w.created_at.split('T')[0] === dateStr);
  };

  const handleEditWorkout = async (workout: Workout) => {
    // Close day modal first
    setShowDayModal(false);
    
    // Fetch exercises from SQLite
    const exercisesData = await getExercises(workout.id);

    // Prepare exercises array - preserve weight_unit for proper conversion on display
    let exercisesToSet: Exercise[] = [];
    if (exercisesData && exercisesData.length > 0) {
      exercisesToSet = exercisesData.map(ex => ({
        id: ex.id,
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        weight_lbs: ex.weight_lbs,
        weight_unit: (ex.weight_unit as 'lbs' | 'kg') || 'lbs',
        notes: ex.notes || '',
      }));
    }

    // Set all state together
    setEditingWorkout(workout);
    setWorkoutType(workout.workout_type);
    setDuration(String(workout.duration_minutes));
    setIntensity(String(workout.intensity));
    setWorkoutNotes(workout.notes);
    setExercises(exercisesToSet);
    
    // Small delay to ensure state updates are applied
    setTimeout(() => {
      setShowEditWorkoutModal(true);
    }, 50);
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { exercise_name: '', sets: 3, reps: 10, weight_lbs: 0, weight_unit: profile?.weight_unit || 'lbs', notes: '' },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (
    index: number,
    field: keyof Exercise,
    value: any,
    additionalUpdates?: Partial<Exercise>
  ) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, ...additionalUpdates };
      return updated;
    });
  };

  const handleSaveWorkout = async () => {
    if (!profile || !editingWorkout) {
      return;
    }

    // Validate workout data
    const workoutValidation = validateWorkout({
      workout_type: workoutType,
      duration_minutes: parseInt(duration) || 0,
      intensity: parseInt(intensity) || 0,
      notes: workoutNotes,
    });

    if (!workoutValidation.isValid) {
      Alert.alert('Validation Error', getFirstError(workoutValidation) || 'Invalid workout data');
      return;
    }

    // Validate exercises
    for (let i = 0; i < exercises.length; i++) {
      const exerciseValidation = validateExercise({
        exercise_name: exercises[i].exercise_name,
        sets: exercises[i].sets,
        reps: exercises[i].reps,
        weight_lbs: exercises[i].weight_lbs,
        notes: exercises[i].notes,
      });

      if (!exerciseValidation.isValid) {
        Alert.alert(
          'Exercise Validation Error',
          `Exercise ${i + 1}: ${getFirstError(exerciseValidation)}`
        );
        return;
      }
    }

    setSaving(true);

    try {
      // Update workout
      await updateWorkoutMutation.mutateAsync({
        id: editingWorkout.id,
        updates: {
          workout_type: workoutType,
          duration_minutes: parseInt(duration) || 0,
          intensity: parseInt(intensity) || 5,
          notes: workoutNotes,
        },
      });

      // Delete old exercises
      await deleteExercisesByWorkout(editingWorkout.id);

      // Insert new exercises if any
      if (exercises.length > 0) {
        const exercisesData = exercises.map((ex) => ({
          workout_id: editingWorkout.id,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_lbs: ex.weight_lbs,
          weight_unit: ex.weight_unit || profile.weight_unit || 'lbs',
          notes: ex.notes || '',
        }));

        await createExercisesMutation.mutateAsync(exercisesData);
      }

      setSaving(false);
      setShowEditWorkoutModal(false);
      resetForm();
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
      setSaving(false);
    }
  };

  const resetForm = () => {
    setWorkoutType('table_practice');
    setDuration('30');
    setIntensity('5');
    setWorkoutNotes('');
    setExercises([]);
    setEditingWorkout(null);
  };

  // Helper functions for add workout modal
  const handleAddExerciseToNew = () => {
    setAddExercises([
      ...addExercises,
      { exercise_name: '', sets: 3, reps: 10, weight_lbs: 0, weight_unit: profile?.weight_unit || 'lbs', notes: '' },
    ]);
  };

  const handleRemoveExerciseFromNew = (index: number) => {
    setAddExercises(addExercises.filter((_, i) => i !== index));
  };

  const handleUpdateExerciseInNew = (
    index: number,
    field: keyof Exercise,
    value: any,
    additionalUpdates?: Partial<Exercise>
  ) => {
    setAddExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, ...additionalUpdates };
      return updated;
    });
  };

  const resetAddWorkoutForm = () => {
    setAddWorkoutType('table_practice');
    setAddDuration('30');
    setAddIntensity('5');
    setAddWorkoutNotes('');
    setAddExercises([]);
    setAddWorkoutCycleId(null);
  };

  const handleAddWorkout = async () => {
    if (!profile || !selectedDate) {
      return;
    }

    // Validate workout data
    const workoutValidation = validateWorkout({
      workout_type: addWorkoutType,
      duration_minutes: parseInt(addDuration) || 0,
      intensity: parseInt(addIntensity) || 0,
      notes: addWorkoutNotes,
    });

    if (!workoutValidation.isValid) {
      Alert.alert('Validation Error', getFirstError(workoutValidation) || 'Invalid workout data');
      return;
    }

    // Validate exercises
    for (let i = 0; i < addExercises.length; i++) {
      const exerciseValidation = validateExercise({
        exercise_name: addExercises[i].exercise_name,
        sets: addExercises[i].sets,
        reps: addExercises[i].reps,
        weight_lbs: addExercises[i].weight_lbs,
        notes: addExercises[i].notes,
      });

      if (!exerciseValidation.isValid) {
        Alert.alert(
          'Exercise Validation Error',
          `Exercise ${i + 1}: ${getFirstError(exerciseValidation)}`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}T00:00:00Z`;

      // Create workout
      const workoutId = await createWorkoutMutation.mutateAsync({
        user_id: profile.id,
        workout_type: addWorkoutType,
        duration_minutes: parseInt(addDuration) || 0,
        intensity: parseInt(addIntensity) || 5,
        notes: addWorkoutNotes,
        cycle_id: addWorkoutCycleId,
        created_at: dateStr,
      });

      // Insert exercises if any
      if (addExercises.length > 0) {
        const exercisesData = addExercises.map((ex) => ({
          workout_id: workoutId,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight_lbs: ex.weight_lbs,
          weight_unit: ex.weight_unit || profile.weight_unit || 'lbs',
          notes: ex.notes || '',
        }));

        await createExercisesMutation.mutateAsync(exercisesData);
      }

      setSaving(false);
      setShowAddWorkoutModal(false);
      resetAddWorkoutForm();
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
      setSaving(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!profile || !selectedDate) {
      return;
    }

    if (!scheduleTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the scheduled training');
      return;
    }

    setSaving(true);

    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Create scheduled training
      await createScheduledTrainingMutation.mutateAsync({
        user_id: profile.id,
        title: scheduleTitle,
        description: scheduleDescription,
        scheduled_date: dateStr,
        scheduled_time: scheduleTime,
        notification_enabled: false,
        notification_minutes_before: 30,
        notification_id: null,
        completed: false,
      });

      setSaving(false);
      setShowScheduleModal(false);
      setScheduleTitle('');
      setScheduleDescription('');
      setScheduleTime('09:00');
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
      setSaving(false);
    }
  };

  const handleDeleteWorkout = (workout: Workout) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkoutMutation.mutateAsync(workout.id);
              // Data refreshes automatically via React Query
            } catch (error) {
              const errorMessage = handleError(error);
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  // View modal handlers
  const handleViewWorkout = async (workout: Workout) => {
    setViewingWorkout(workout);
    setLoadingViewExercises(true);

    // Close day modal first
    setShowDayModal(false);

    // Load exercises
    try {
      const exercisesData = await getExercises(workout.id);
      setViewModalExercises(exercisesData || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setViewModalExercises([]);
    } finally {
      setLoadingViewExercises(false);
    }

    // Open view modal after day modal closes
    setTimeout(() => {
      setShowWorkoutViewModal(true);
    }, 300);
  };

  const handleViewGoal = (goal: Goal) => {
    setViewingGoal(goal);

    // Close day modal first
    setShowDayModal(false);

    // Open view modal after day modal closes
    setTimeout(() => {
      setShowGoalViewModal(true);
    }, 300);
  };

  const handleViewPR = (pr: StrengthTest) => {
    setViewingPR(pr);

    // Close day modal first
    setShowDayModal(false);

    // Open view modal after day modal closes
    setTimeout(() => {
      setShowPRViewModal(true);
    }, 300);
  };

  const handleEditFromViewModal = (workout: Workout) => {
    setShowWorkoutViewModal(false);
    setTimeout(() => handleEditWorkout(workout), 300);
  };

  const handleCloseViewModal = (modalType: 'workout' | 'goal' | 'pr') => {
    // Close the view modal
    if (modalType === 'workout') {
      setShowWorkoutViewModal(false);
    } else if (modalType === 'goal') {
      setShowGoalViewModal(false);
    } else if (modalType === 'pr') {
      setShowPRViewModal(false);
    }

    // Reopen the day modal after a delay
    setTimeout(() => {
      setShowDayModal(true);
    }, 300);
  };

  const getProgressPercentage = (goal: Goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showWorkouts ? styles.filterButtonActive : null,
            ]}
            onPress={() => setShowWorkouts(!showWorkouts)}
          >
            <Text
              style={[
                styles.filterText,
                showWorkouts ? styles.filterTextActive : null,
              ]}
            >
              Workouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showCycles ? styles.filterButtonActive : null,
            ]}
            onPress={() => setShowCycles(!showCycles)}
          >
            <Text
              style={[
                styles.filterText,
                showCycles ? styles.filterTextActive : null,
              ]}
            >
              Cycles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showGoals ? styles.filterButtonActive : null,
            ]}
            onPress={() => setShowGoals(!showGoals)}
          >
            <Text
              style={[
                styles.filterText,
                showGoals ? styles.filterTextActive : null,
              ]}
            >
              Goals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showStrengthTests ? styles.filterButtonActive : null,
            ]}
            onPress={() => setShowStrengthTests(!showStrengthTests)}
          >
            <Text
              style={[
                styles.filterText,
                showStrengthTests ? styles.filterTextActive : null,
              ]}
            >
              PR's
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScrollView}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#2A2A2A' }]} />
            <Text style={styles.legendText}>No activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#2A7DE144', borderWidth: 2, borderColor: '#2A7DE1' }]}
            />
            <Text style={styles.legendText}>In cycle</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendBox}>
              <View style={[styles.legendBox, { backgroundColor: '#2A7DE144', borderWidth: 2, borderColor: '#2A7DE1', position: 'absolute' }]} />
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2A7DE1', zIndex: 1 }}>2</Text>
            </View>
            <Text style={styles.legendText}>Multiple cycles</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#FFA50055' }]}
            />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#10B98155' }]}
            />
            <Text style={styles.legendText}>Test</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#E6394655' }]}
            />
            <Text style={styles.legendText}>1 workout</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendBox, { backgroundColor: '#E63946' }]}
            />
            <Text style={styles.legendText}>3+ workouts</Text>
          </View>
        </View>
      </ScrollView>

      {/* AdMob Banner - Automatic test/production ads */}
      <AdBanner />

      <View style={styles.content}>
        {renderCalendar()}
      </View>

      <Modal
        visible={showDayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowDayModal(false)}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedDate && (
                <>
                  {/* Add Workout / Schedule Training Button */}
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isFuture = selectedDate > today;

                    return (
                      <TouchableOpacity
                        style={[styles.addWorkoutButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setShowDayModal(false);
                          if (isFuture) {
                            setShowScheduleModal(true);
                          } else {
                            // Auto-select cycle if there's exactly one active on this date
                            const cycleInfo = isDateInCycle(selectedDate);
                            if (cycleInfo.allCycles && cycleInfo.allCycles.length === 1) {
                              setAddWorkoutCycleId(cycleInfo.allCycles[0].id);
                            } else {
                              setAddWorkoutCycleId(null);
                            }
                            setShowAddWorkoutModal(true);
                          }
                        }}
                      >
                        <Plus size={20} color="#FFF" />
                        <Text style={styles.addWorkoutButtonText}>
                          {isFuture ? 'Schedule Training' : 'Log Workout'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}

                  {getScheduledTrainingsForDate(selectedDate).length > 0 && (
                    <>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                        Scheduled Trainings ({getScheduledTrainingsForDate(selectedDate).length})
                      </Text>
                      {getScheduledTrainingsForDate(selectedDate).map((training) => (
                        <View key={training.id} style={[styles.scheduledCard, { backgroundColor: colors.surface }]}>
                          <View style={styles.scheduledHeader}>
                            <Text style={[styles.scheduledTitle, { color: colors.primary }]}>
                              {training.title}
                            </Text>
                            <Text style={[styles.scheduledTime, { color: colors.textSecondary }]}>
                              {new Date(`2000-01-01T${training.scheduled_time}`).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                          {training.description && (
                            <Text style={[styles.scheduledDescription, { color: colors.textSecondary }]}>
                              {training.description}
                            </Text>
                          )}
                        </View>
                      ))}
                    </>
                  )}

                  {getStrengthTestsForDate(selectedDate).length > 0 && (
                    <>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                        Personal Records ({getStrengthTestsForDate(selectedDate).length})
                      </Text>
                      {getStrengthTestsForDate(selectedDate).map((test) => {
                        const userUnit = profile?.weight_unit || 'lbs';
                        const storedUnit = test.result_unit || 'lbs';
                        const displayValue = convertWeight(test.result_value, storedUnit, userUnit);
                        
                        return (
                          <TouchableOpacity
                            key={test.id}
                            style={[styles.strengthTestCard, { backgroundColor: colors.surface }]}
                            onPress={() => handleViewPR(test)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.strengthTestHeader}>
                              <TrendingUp size={20} color="#10B981" />
                              <Text style={[styles.strengthTestType, { color: colors.text }]}>
                                {test.test_type.replace(/_/g, ' ').toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.strengthTestResult, { color: '#10B981' }]}>
                              {formatWeight(displayValue, userUnit)}
                            </Text>
                            {test.notes && (
                              <Text style={[styles.strengthTestNotes, { color: colors.textSecondary }]}>
                                {test.notes}
                              </Text>
                            )}
                            <Text style={[styles.strengthTestTime, { color: colors.textSecondary }]}>
                              {new Date(test.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}

                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    Workouts ({getWorkoutsForDate(selectedDate).length})
                  </Text>
                  {getWorkoutsForDate(selectedDate).map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={[styles.workoutCard, { backgroundColor: colors.surface }]}
                      onPress={() => handleViewWorkout(workout)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.workoutCardHeader}>
                        <Text style={[styles.workoutType, { color: colors.primary }]}>
                          {workout.workout_type?.replace(/_/g, ' ').toUpperCase() || 'WORKOUT'}
                        </Text>
                        <View style={styles.workoutActions}>
                          <TouchableOpacity
                            style={styles.workoutActionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEditWorkout(workout);
                            }}
                          >
                            <Pencil size={18} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.workoutActionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkout(workout);
                            }}
                          >
                            <Trash2 size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.workoutStats}>
                        <View style={styles.workoutStat}>
                          <Text style={[styles.workoutStatLabel, { color: colors.textTertiary }]}>Duration</Text>
                          <Text style={[styles.workoutStatValue, { color: colors.text }]}>{workout.duration_minutes} min</Text>
                        </View>
                        <View style={styles.workoutStat}>
                          <Text style={[styles.workoutStatLabel, { color: colors.textTertiary }]}>Intensity</Text>
                          <Text style={[styles.workoutStatValue, { color: colors.text }]}>{workout.intensity}/10</Text>
                        </View>
                        <View style={styles.workoutStat}>
                          <Text style={[styles.workoutStatLabel, { color: colors.textTertiary }]}>Time</Text>
                          <Text style={[styles.workoutStatValue, { color: colors.text }]}>
                            {new Date(workout.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                      {workout.notes && (
                        <Text style={[styles.workoutNotes, { color: colors.textSecondary }]}>{workout.notes}</Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                    Goals ({getGoalsForDate(selectedDate).length})
                  </Text>
                  {getGoalsForDate(selectedDate).length > 0 ? (
                    getGoalsForDate(selectedDate).map((goal) => (
                      <TouchableOpacity
                        key={goal.id}
                        style={[styles.goalCard, { backgroundColor: colors.surface }]}
                        onPress={() => handleViewGoal(goal)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.goalContent}>
                          <Text style={styles.goalEmoji}>🎯</Text>
                          <View style={styles.goalInfo}>
                            <Text style={[styles.goalTitle, { color: colors.primary }, goal.is_completed ? styles.goalCompleted : null]}>
                              {goal.goal_type}
                            </Text>
                            {goal.is_completed ? (
                              <Text style={[styles.goalStatus, { color: '#10B981' }]}>✓ Completed</Text>
                            ) : null}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No goals for this date</Text>
                  )}

                  {isDateInCycle(selectedDate).isInCycle && (
                    <>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>
                        Training Cycles ({isDateInCycle(selectedDate).cycleCount || 0})
                      </Text>
                      {isDateInCycle(selectedDate).allCycles?.map((cycle) => (
                        <View key={cycle.id} style={[styles.cycleCard, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.cycleName, { color: colors.primary }]}>
                            {cycle.name}
                          </Text>
                          <Text style={[styles.cycleType, { color: colors.textSecondary }]}>
                            {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                          <Text style={[styles.cycleDates, { color: colors.textTertiary }]}>
                            {new Date(cycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(cycle.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Workout Modal */}
      <Modal
        visible={showEditWorkoutModal}
        animationType="slide"
        onRequestClose={() => setShowEditWorkoutModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[{ flex: 1 }, { backgroundColor: colors.background }]}
        >
          <View style={[styles.editModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 20, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Training
              </Text>
              <TouchableOpacity onPress={() => setShowEditWorkoutModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 400 }}
            >
            <Text style={[styles.label, { color: colors.text }]}>Workout Type</Text>
            <View style={styles.typeContainer}>
              {['table_practice', 'strength', 'technique', 'endurance', 'sparring'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    workoutType === type && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setWorkoutType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      workoutType === type && [styles.typeButtonTextActive, { color: '#FFF' }],
                    ]}
                  >
                    {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Intensity (1-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={intensity}
              onChangeText={setIntensity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it go?"
              placeholderTextColor={colors.textTertiary}
            />

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={[styles.label, { color: colors.text }]}>Exercises</Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Plus size={20} color={colors.primary} />
                  <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.exerciseCardHeader}>
                    <Text style={[styles.exerciseCardTitle, { color: colors.text }]}>Exercise {index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      value={exercise.exercise_name}
                      onChangeText={(val) =>
                        handleUpdateExercise(index, 'exercise_name', val)
                      }
                      placeholder="Exercise name"
                      placeholderTextColor={colors.textTertiary}
                    />

                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Sets</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.sets)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'sets', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Reps</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.reps)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'reps', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Weight ({profile?.weight_unit || 'lbs'})</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(Math.round(convertWeight(
                          exercise.weight_lbs,
                          exercise.weight_unit || 'lbs',  // Convert from stored unit
                          profile?.weight_unit || 'lbs'   // To display unit
                        )))}
                        onChangeText={(val) => {
                          // Allow empty string for clearing
                          if (val === '') {
                            handleUpdateExercise(index, 'weight_lbs', 0, { weight_unit: profile?.weight_unit || 'lbs' });
                            return;
                          }
                          const inputValue = parseInt(val);
                          if (!isNaN(inputValue)) {
                            // Store in user's current preferred unit
                            handleUpdateExercise(index, 'weight_lbs', inputValue, { weight_unit: profile?.weight_unit || 'lbs' });
                          }
                        }}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]}
              onPress={handleSaveWorkout}
              disabled={saving}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Update Training'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Workout Modal */}
      <Modal
        visible={showAddWorkoutModal}
        animationType="slide"
        onRequestClose={() => setShowAddWorkoutModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[{ flex: 1 }, { backgroundColor: colors.background }]}
        >
          <View style={[styles.editModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 20, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Log Workout for {selectedDate?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowAddWorkoutModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 400 }}
            >
            <Text style={[styles.label, { color: colors.text }]}>Workout Type</Text>
            <View style={styles.typeContainer}>
              {['table_practice', 'strength', 'technique', 'endurance', 'sparring'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    addWorkoutType === type && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setAddWorkoutType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      addWorkoutType === type && [styles.typeButtonTextActive, { color: '#FFF' }],
                    ]}
                  >
                    {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedDate && isDateInCycle(selectedDate).isInCycle && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Training Cycle (Optional)</Text>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      addWorkoutCycleId === null && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                    ]}
                    onPress={() => setAddWorkoutCycleId(null)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: colors.textSecondary },
                        addWorkoutCycleId === null && [styles.typeButtonTextActive, { color: '#FFF' }],
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {isDateInCycle(selectedDate).allCycles?.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.id}
                      style={[
                        styles.typeButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        addWorkoutCycleId === cycle.id && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                      ]}
                      onPress={() => setAddWorkoutCycleId(cycle.id)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          { color: colors.textSecondary },
                          addWorkoutCycleId === cycle.id && [styles.typeButtonTextActive, { color: '#FFF' }],
                        ]}
                      >
                        {cycle.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={addDuration}
              onChangeText={setAddDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Intensity (1-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={addIntensity}
              onChangeText={setAddIntensity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={addWorkoutNotes}
              onChangeText={setAddWorkoutNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it go?"
              placeholderTextColor={colors.textTertiary}
            />

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={[styles.label, { color: colors.text }]}>Exercises</Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExerciseToNew}
                >
                  <Plus size={20} color={colors.primary} />
                  <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {addExercises.map((exercise, index) => (
                <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.exerciseCardHeader}>
                    <Text style={[styles.exerciseCardTitle, { color: colors.text }]}>Exercise {index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveExerciseFromNew(index)}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      value={exercise.exercise_name}
                      onChangeText={(val) =>
                        handleUpdateExerciseInNew(index, 'exercise_name', val)
                      }
                      placeholder="Exercise name"
                      placeholderTextColor={colors.textTertiary}
                    />

                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Sets</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.sets)}
                        onChangeText={(val) =>
                          handleUpdateExerciseInNew(index, 'sets', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Reps</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.reps)}
                        onChangeText={(val) =>
                          handleUpdateExerciseInNew(index, 'reps', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Weight ({profile?.weight_unit || 'lbs'})</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        value={String(Math.round(convertWeight(
                          exercise.weight_lbs,
                          exercise.weight_unit || 'lbs',  // Convert from stored unit
                          profile?.weight_unit || 'lbs'   // To display unit
                        )))}
                        onChangeText={(val) => {
                          // Allow empty string for clearing
                          if (val === '') {
                            handleUpdateExerciseInNew(index, 'weight_lbs', 0, { weight_unit: profile?.weight_unit || 'lbs' });
                            return;
                          }
                          const inputValue = parseInt(val);
                          if (!isNaN(inputValue)) {
                            // Store in user's current preferred unit
                            handleUpdateExerciseInNew(index, 'weight_lbs', inputValue, { weight_unit: profile?.weight_unit || 'lbs' });
                          }
                        }}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]}
              onPress={handleAddWorkout}
              disabled={saving}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Log Workout'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Schedule Training Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[{ flex: 1 }, { backgroundColor: colors.background }]}
        >
          <View style={[styles.editModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 20, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Schedule Training for {selectedDate?.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 400 }}
            >
            <Text style={[styles.label, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={scheduleTitle}
              onChangeText={setScheduleTitle}
              placeholder="e.g., Morning Training Session"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={scheduleDescription}
              onChangeText={setScheduleDescription}
              multiline
              numberOfLines={3}
              placeholder="What are you planning to train?"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Time (HH:MM)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={scheduleTime}
              onChangeText={setScheduleTime}
              placeholder="09:00"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]}
              onPress={handleAddSchedule}
              disabled={saving}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Schedule Training'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Detail Modals */}
      {/* Workout Detail Modal */}
      <Modal
        visible={showWorkoutViewModal}
        animationType="slide"
        onRequestClose={() => handleCloseViewModal('workout')}
      >
        <View style={[styles.viewModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TrendingUp size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Workout Details</Text>
            </View>
            <TouchableOpacity onPress={() => handleCloseViewModal('workout')}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {viewingWorkout && (
              <View style={{ gap: 16 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {viewingWorkout.workout_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(viewingWorkout.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {viewingWorkout.duration_minutes} minutes
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Intensity</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {viewingWorkout.intensity} / 10
                  </Text>
                </View>

                {viewingWorkout.notes && (
                  <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Notes</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                      {viewingWorkout.notes}
                    </Text>
                  </View>
                )}

                {/* Exercises Section */}
                {loadingViewExercises ? (
                  <View style={styles.exercisesSectionView}>
                    <Text style={[styles.exercisesSectionTitle, { color: colors.text }]}>Exercises</Text>
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                  </View>
                ) : viewModalExercises.length > 0 ? (
                  <View style={styles.exercisesSectionView}>
                    <Text style={[styles.exercisesSectionTitle, { color: colors.text }]}>
                      Exercises ({viewModalExercises.length})
                    </Text>
                    {viewModalExercises.map((exercise, index) => {
                      const userUnit = profile?.weight_unit || 'lbs';
                      const storedUnit = exercise.weight_unit || 'lbs';
                      const displayWeight = exercise.weight_lbs && exercise.weight_lbs > 0
                        ? convertWeight(exercise.weight_lbs, storedUnit as 'lbs' | 'kg', userUnit as 'lbs' | 'kg')
                        : null;

                      return (
                        <View
                          key={exercise.id}
                          style={[styles.exerciseCardView, { backgroundColor: colors.background }]}
                        >
                          <View style={styles.exerciseHeaderView}>
                            <Text style={[styles.exerciseNameView, { color: colors.text }]}>
                              {index + 1}. {exercise.exercise_name}
                            </Text>
                          </View>
                          <View style={styles.exerciseDetailsView}>
                            {exercise.sets > 0 && (
                              <Text style={[styles.exerciseDetailText, { color: colors.textSecondary }]}>
                                {exercise.sets} sets
                              </Text>
                            )}
                            {exercise.reps > 0 && (
                              <>
                                <Text style={[styles.exerciseDivider, { color: colors.border }]}>•</Text>
                                <Text style={[styles.exerciseDetailText, { color: colors.textSecondary }]}>
                                  {exercise.reps} reps
                                </Text>
                              </>
                            )}
                            {displayWeight && (
                              <>
                                <Text style={[styles.exerciseDivider, { color: colors.border }]}>•</Text>
                                <Text style={[styles.exerciseDetailText, { color: colors.textSecondary }]}>
                                  {displayWeight} {userUnit}
                                </Text>
                              </>
                            )}
                          </View>
                          {exercise.notes && (
                            <Text style={[styles.exerciseNotesView, { color: colors.textTertiary }]}>
                              {exercise.notes}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButtonSecondary, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                    onPress={() => handleEditFromViewModal(viewingWorkout)}
                  >
                    <Pencil size={18} color={colors.primary} />
                    <Text style={[styles.modalButtonSecondaryText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => handleCloseViewModal('workout')}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Goal Detail Modal */}
      <Modal
        visible={showGoalViewModal}
        animationType="slide"
        onRequestClose={() => handleCloseViewModal('goal')}
      >
        <View style={[styles.viewModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Target size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Goal Details</Text>
            </View>
            <TouchableOpacity onPress={() => handleCloseViewModal('goal')}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {viewingGoal && (
              <View style={{ gap: 16 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {viewingGoal.goal_type || 'No description'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Progress</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {viewingGoal.current_value || 0} / {viewingGoal.target_value || 0}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Completion</Text>
                  <Text style={[styles.detailValue, { color: colors.secondary }]}>
                    {Math.round(getProgressPercentage(viewingGoal))}%
                  </Text>
                </View>

                {viewingGoal.deadline ? (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Deadline</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(viewingGoal.deadline).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                ) : null}

                {viewingGoal.notes && viewingGoal.notes.trim() ? (
                  <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Notes</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'left' }]}>
                      {viewingGoal.notes}
                    </Text>
                  </View>
                ) : null}

                <View style={[styles.progressBarContainer, { backgroundColor: colors.background, marginTop: 20 }]}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${getProgressPercentage(viewingGoal)}%`, backgroundColor: viewingGoal.is_completed ? '#FFD700' : colors.secondary }
                    ]}
                  />
                </View>

                {viewingGoal.is_completed ? (
                  <View style={styles.completedBadge}>
                    <Trophy size={20} color="#FFD700" style={{ marginRight: 8 }} />
                    <Text style={styles.completedText}>Completed! 🎉</Text>
                  </View>
                ) : null}

                <View style={styles.viewModalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.viewModalButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => handleCloseViewModal('goal')}
                  >
                    <Text style={styles.viewModalButtonPrimaryText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* PR Detail Modal */}
      <Modal
        visible={showPRViewModal}
        animationType="slide"
        onRequestClose={() => handleCloseViewModal('pr')}
      >
        <View style={[styles.viewModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TrendingUp size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>PR Details</Text>
            </View>
            <TouchableOpacity onPress={() => handleCloseViewModal('pr')}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {viewingPR && (
              <View style={{ gap: 16 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {(viewingPR.test_type || '').replace(/_/g, ' ').toUpperCase() || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Current PR</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatWeight(
                      convertWeight(
                        viewingPR.result_value || 0,
                        viewingPR.result_unit || 'lbs',
                        profile?.weight_unit || 'lbs'
                      ),
                      profile?.weight_unit || 'lbs'
                    )}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Latest Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(viewingPR.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {viewingPR.notes && viewingPR.notes.trim() ? (
                  <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Notes</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'left' }]}>
                      {viewingPR.notes}
                    </Text>
                  </View>
                ) : null}

                {/* History Section */}
                {(() => {
                  const prHistory = strengthTests
                    .filter(t => t.test_type === viewingPR.test_type)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                  return prHistory.length > 1 ? (
                    <View style={styles.prHistorySection}>
                      <Text style={[styles.prHistorySectionTitle, { color: colors.text }]}>
                        History ({prHistory.length} entries)
                      </Text>
                      {prHistory.map((entry, index) => {
                        const displayValue = convertWeight(
                          entry.result_value || 0,
                          entry.result_unit || 'lbs',
                          profile?.weight_unit || 'lbs'
                        );
                        return (
                          <View
                            key={entry.id || index}
                            style={[styles.prHistoryCard, { backgroundColor: colors.background }]}
                          >
                            <View style={styles.prHistoryHeader}>
                              <Text style={[styles.prHistoryIndex, { color: colors.textSecondary }]}>
                                #{index + 1}
                              </Text>
                              <Text style={[styles.prHistoryDate, { color: colors.textSecondary }]}>
                                {new Date(entry.created_at || new Date()).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                            <Text style={[styles.prHistoryValue, { color: colors.primary }]}>
                              {formatWeight(displayValue, profile?.weight_unit || 'lbs')}
                            </Text>
                            {entry.notes && entry.notes.trim() ? (
                              <Text style={[styles.prHistoryNotes, { color: colors.textTertiary }]}>
                                {entry.notes}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : null;
                })()}

                <View style={styles.viewModalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.viewModalButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => handleCloseViewModal('pr')}
                  >
                    <Text style={styles.viewModalButtonPrimaryText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    minWidth: 100,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#E63946',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#FFF',
  },
  legendScrollView: {
    flexGrow: 0,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  calendarContainer: {
    paddingVertical: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthYearTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  dayHeadersContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  dayHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  day: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  dayText: {
    fontSize: 12,
    color: '#666',
  },
  dayTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutActionButton: {
    padding: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutStat: {
    flex: 1,
    alignItems: 'center',
  },
  workoutStatLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  workoutStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cycleCard: {
    backgroundColor: '#2A7DE144',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A7DE1',
  },
  cycleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A7DE1',
  },
  multipleCyclesIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#2A7DE1',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  multipleCyclesText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goalIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  goalIndicatorText: {
    fontSize: 10,
  },
  strengthTestIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
  },
  strengthTestIndicatorText: {
    fontSize: 10,
  },
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalEmoji: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  goalCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  scheduledIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  scheduledIndicatorText: {
    fontSize: 8,
  },
  scheduledCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  scheduledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduledTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  scheduledTime: {
    fontSize: 14,
    color: '#999',
  },
  scheduledDescription: {
    fontSize: 14,
    color: '#CCC',
  },
  strengthTestCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  strengthTestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  strengthTestType: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthTestResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  strengthTestNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  strengthTestTime: {
    fontSize: 12,
  },
  cycleType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cycleDates: {
    fontSize: 11,
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  typeButtonActive: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#999',
  },
  typeButtonTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  exercisesSection: {
    marginTop: 24,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addExerciseText: {
    fontSize: 14,
    color: '#E63946',
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  exerciseInputGroup: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBottomSpacing: {
    height: 40,
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addWorkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // View Modal Styles
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exercisesSectionView: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  exercisesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exerciseCardView: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseHeaderView: {
    marginBottom: 6,
  },
  exerciseNameView: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseDetailsView: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  exerciseDetailText: {
    fontSize: 14,
  },
  exerciseDivider: {
    fontSize: 14,
    marginHorizontal: 6,
  },
  exerciseNotesView: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  viewModalButtonsRow: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
    gap: 12,
  },
  viewModalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewModalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
  },
  viewModalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginTop: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  prHistorySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  prHistorySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  prHistoryCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  prHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  prHistoryIndex: {
    fontSize: 12,
    fontWeight: '600',
  },
  prHistoryDate: {
    fontSize: 12,
  },
  prHistoryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prHistoryNotes: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  viewModalContainer: {
    flex: 1,
  },
});
