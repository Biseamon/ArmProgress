import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Workout, Cycle, Exercise as ExerciseType } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { AdMediumRectangle } from '@/components/AdMediumRectangle';
import { PaywallModal } from '@/components/PaywallModal';
import { Plus, X, Save, Pencil, Trash2, Calendar as CalendarIcon, Clock, TrendingUp } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { convertFromLbs, convertToLbs, convertWeight } from '@/lib/weightUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateWorkout, validateExercise, validateCycle, getFirstError } from '@/lib/validation';
import { handleError } from '@/lib/errorHandling';
import {
  useWorkouts,
  useCycles,
  useCreateWorkout,
  useUpdateWorkout,
  useDeleteWorkout,
  useCreateCycle,
  useUpdateCycle,
  useDeleteCycle,
  useSetActiveCycle,
  useCreateExercises,
} from '@/lib/react-query-sqlite-complete';
import { getExercises, deleteExercisesByWorkout } from '@/lib/db/queries/exercises';

type Exercise = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  weight_unit?: 'lbs' | 'kg';
  notes: string;
};

export default function Training() {
  const { profile, isPremium } = useAuth();
  const { colors, theme } = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Use SQLite hooks for offline-first data
  const { data: allWorkouts = [], isLoading: workoutsLoading } = useWorkouts();
  const { data: cycles = [], isLoading: cyclesLoading } = useCycles();
  
  // Pagination state
  const [displayedWorkoutsCount, setDisplayedWorkoutsCount] = useState(10);
  
  // Get paginated workouts
  const workouts = allWorkouts.slice(0, displayedWorkoutsCount);
  const hasMoreWorkouts = displayedWorkoutsCount < allWorkouts.length;
  
  // Mutations
  const createWorkoutMutation = useCreateWorkout();
  const updateWorkoutMutation = useUpdateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();
  const createCycleMutation = useCreateCycle();
  const updateCycleMutation = useUpdateCycle();
  const deleteCycleMutation = useDeleteCycle();
  const setActiveCycleMutation = useSetActiveCycle();
  const createExercisesMutation = useCreateExercises();
  
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [workoutType, setWorkoutType] = useState('table_practice');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState('5');
  const [notes, setNotes] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [cycleName, setCycleName] = useState('');
  const [cycleType, setCycleType] = useState('competition_prep');
  const [cycleDescription, setCycleDescription] = useState('');
  const [cycleStartDate, setCycleStartDate] = useState(new Date());
  const [cycleEndDate, setCycleEndDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Handle edit workout from calendar
  useFocusEffect(
    useCallback(() => {
      const editWorkoutId = params.editWorkoutId as string | undefined;

      if (editWorkoutId && workouts && workouts.length > 0) {
        const workoutToEdit = workouts.find(w => w.id === editWorkoutId);
        if (workoutToEdit) {
          // Clear the parameter to avoid re-triggering
          router.setParams({ editWorkoutId: undefined });
          // Trigger edit
          handleEditWorkout(workoutToEdit);
        }
      }
    }, [params.editWorkoutId, workouts])
  );

  const handleStartWorkout = () => {
    // Removed premium check - workouts are unlimited for everyone!
    setEditingWorkout(null);
    resetForm();
    setShowWorkoutModal(true);
  };

  const handleEditWorkout = async (workout: Workout) => {
    setEditingWorkout(workout);
    setWorkoutType(workout.workout_type);
    setDuration(workout.duration_minutes?.toString() || '');
    setIntensity(workout.intensity?.toString() || '');
    setNotes(workout.notes || '');
    setSelectedCycleId(workout.cycle_id);
    
    // Load exercises from SQLite
    const exercisesData = await getExercises(workout.id);
    
    if (exercisesData) {
      // Preserve original weight_unit for proper conversion on display
      const mappedExercises = exercisesData.map(exercise => ({
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_lbs: exercise.weight_lbs,
        weight_unit: (exercise.weight_unit as 'lbs' | 'kg') || 'lbs',
        notes: exercise.notes || '',
      }));

      setExercises(mappedExercises);
    }
    
    setShowWorkoutModal(true);
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

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { exercise_name: '', sets: 3, reps: 10, weight_lbs: 0, weight_unit: profile?.weight_unit || 'lbs', notes: '' },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, field: keyof Exercise, value: any, additionalUpdates?: Partial<Exercise>) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, ...additionalUpdates };
      return updated;
    });
  };

  const handleSaveWorkout = async () => {
    if (!profile) {
      console.log('No profile found');
      return;
    }

    // Validate workout data
    const workoutValidation = validateWorkout({
      workout_type: workoutType,
      duration_minutes: parseInt(duration) || 0,
      intensity: parseInt(intensity) || 0,
      notes,
      cycle_id: selectedCycleId,
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
      let workoutId: string;
      const userUnit = profile.weight_unit || 'lbs';

      if (editingWorkout) {
        // Update existing workout
        await updateWorkoutMutation.mutateAsync({
          id: editingWorkout.id,
          updates: {
            workout_type: workoutType,
            duration_minutes: parseInt(duration),
            intensity: parseInt(intensity),
            notes,
            cycle_id: selectedCycleId,
          },
        });
        workoutId = editingWorkout.id;
  
        // Delete existing exercises for this workout
        await deleteExercisesByWorkout(workoutId);
        
      } else {
        // Create new workout
        workoutId = await createWorkoutMutation.mutateAsync({
          user_id: profile.id,
          workout_type: workoutType,
          duration_minutes: parseInt(duration),
          intensity: parseInt(intensity),
          notes,
          cycle_id: selectedCycleId,
        });
      }
  
      // Insert exercises if any exist
      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map(exercise => ({
          workout_id: workoutId,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_lbs: exercise.weight_lbs,
          weight_unit: exercise.weight_unit || userUnit || 'lbs',
          notes: exercise.notes || '',
        }));

        await createExercisesMutation.mutateAsync(exercisesToInsert);
      }
      
      setShowWorkoutModal(false);
      resetForm();
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCycle = () => {
    // Check cycle limit for free users
    if (!isPremium && cycles.length >= 1) {
      setShowPaywall(true);
      return;
    }

    setEditingCycle(null);
    resetCycleForm();
    setShowCycleModal(true);
  };

  const handleEditCycle = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setCycleName(cycle.name);
    setCycleType(cycle.cycle_type);
    setCycleDescription(cycle.description || '');
    setCycleStartDate(new Date(cycle.start_date));
    setCycleEndDate(new Date(cycle.end_date));
    setShowCycleModal(true);
  };

  const handleSaveCycle = async () => {
    if (!profile) return;

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Validate cycle data
    const cycleValidation = validateCycle({
      name: cycleName,
      description: cycleDescription,
      cycle_type: cycleType,
      start_date: formatDate(cycleStartDate),
      end_date: formatDate(cycleEndDate),
    });

    if (!cycleValidation.isValid) {
      Alert.alert('Validation Error', getFirstError(cycleValidation) || 'Invalid cycle data');
      return;
    }

    try {
      if (editingCycle) {
        await updateCycleMutation.mutateAsync({
          id: editingCycle.id,
          updates: {
            name: cycleName,
            description: cycleDescription,
            cycle_type: cycleType,
            start_date: formatDate(cycleStartDate),
            end_date: formatDate(cycleEndDate),
          },
        });
      } else {
        await createCycleMutation.mutateAsync({
          user_id: profile.id,
          name: cycleName,
          description: cycleDescription,
          cycle_type: cycleType,
          start_date: formatDate(cycleStartDate),
          end_date: formatDate(cycleEndDate),
          is_active: false,
        });
      }

      setShowCycleModal(false);
      resetCycleForm();
      setEditingCycle(null);
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteCycle = async (cycle: Cycle) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this cycle?')) {
        try {
          await deleteCycleMutation.mutateAsync(cycle.id);
        } catch (error) {
          const errorMessage = handleError(error);
          Alert.alert('Error', errorMessage);
        }
      }
    } else {
      Alert.alert('Delete Cycle', 'Are you sure you want to delete this cycle?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCycleMutation.mutateAsync(cycle.id);
            } catch (error) {
              const errorMessage = handleError(error);
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]);
    }
  };

  const handleToggleActiveCycle = async (cycle: Cycle) => {
    if (!profile) return;
    
    try {
      await setActiveCycleMutation.mutateAsync(cycle.id);
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLoadMore = () => {
    setDisplayedWorkoutsCount(prev => prev + 10);
  };

  const resetForm = () => {
    setWorkoutType('table_practice');
    setDuration('30');
    setIntensity('5');
    setNotes('');
    setSelectedCycleId(null);
    setExercises([]);
    setEditingWorkout(null);
  };

  const resetCycleForm = () => {
    setCycleName('');
    setCycleType('competition_prep');
    setCycleDescription('');
    setCycleStartDate(new Date());
    setCycleEndDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
    setEditingCycle(null);
  };

  const workoutTypes = [
    { value: 'table_practice', label: 'Table Practice' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'technique', label: 'Technique' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'sparring', label: 'Sparring' },
  ];

  const cycleTypes = [
    { value: 'competition_prep', label: 'Competition Prep' },
    { value: 'rehab', label: 'Rehabilitation' },
    { value: 'strength_building', label: 'Strength Building' },
    { value: 'technique_focus', label: 'Technique Focus' },
    { value: 'off_season', label: 'Off Season' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Workout Detail Modal Component
  const WorkoutDetailModal = () => {
    const [exercises, setExercises] = useState<ExerciseType[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    // Fetch exercises when workout is selected
    useFocusEffect(
      useCallback(() => {
        if (viewingWorkout && showViewModal) {
          setLoadingExercises(true);
          getExercises(viewingWorkout.id)
            .then((data) => {
              setExercises(data || []);
            })
            .catch((error) => {
              console.error('[WorkoutModal] Error fetching exercises:', error);
              setExercises([]);
            })
            .finally(() => {
              setLoadingExercises(false);
            });
        } else {
          setExercises([]);
        }
      }, [viewingWorkout, showViewModal])
    );

    // Helper function to convert exercise weight to user's preferred unit
    const getDisplayWeight = (exercise: ExerciseType) => {
      if (!exercise.weight_lbs || exercise.weight_lbs === 0) return null;
      
      const userPreferredUnit = profile?.weight_unit || 'lbs';
      const storedUnit = exercise.weight_unit || 'lbs';
      
      // Convert from stored unit to user's preferred unit
      const convertedWeight = convertWeight(
        exercise.weight_lbs,
        storedUnit as 'lbs' | 'kg',
        userPreferredUnit as 'lbs' | 'kg'
      );
      
      return {
        value: convertedWeight,
        unit: userPreferredUnit,
      };
    };

    if (!viewingWorkout) return null;

    return (
      <Modal
        visible={showViewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowViewModal(false)}
        >
          <Pressable 
            style={[styles.modalContentView, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View style={styles.modalHeaderView}>
                <View style={styles.modalTitleRow}>
                  <TrendingUp size={24} color={colors.primary} />
                  <Text style={[styles.modalTitleView, { color: colors.text }]}>Workout Details</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowViewModal(false)}
                  style={styles.closeButtonView}
                >
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBodyView}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {viewingWorkout.workout_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDateTime(viewingWorkout.created_at)}
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
                {loadingExercises ? (
                  <View style={styles.exercisesSectionView}>
                    <Text style={[styles.exercisesSectionTitle, { color: colors.text }]}>Exercises</Text>
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                  </View>
                ) : exercises.length > 0 ? (
                  <View style={styles.exercisesSectionView}>
                    <Text style={[styles.exercisesSectionTitle, { color: colors.text }]}>
                      Exercises ({exercises.length})
                    </Text>
                    {exercises.map((exercise, index) => (
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
                          {(() => {
                            const displayWeight = getDisplayWeight(exercise);
                            return displayWeight ? (
                              <>
                                <Text style={[styles.exerciseDivider, { color: colors.border }]}>•</Text>
                                <Text style={[styles.exerciseDetailText, { color: colors.textSecondary }]}>
                                  {displayWeight.value} {displayWeight.unit}
                                </Text>
                              </>
                            ) : null;
                          })()}
                        </View>
                        {exercise.notes && (
                          <Text style={[styles.exerciseNotesView, { color: colors.textTertiary }]}>
                            {exercise.notes}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButtonSecondary, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                    onPress={() => {
                      setShowViewModal(false);
                      setTimeout(() => handleEditWorkout(viewingWorkout), 300);
                    }}
                  >
                    <Pencil size={18} color={colors.primary} />
                    <Text style={[styles.modalButtonSecondaryText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                    onPress={() => setShowViewModal(false)}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Training</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, styles.cycleButton]}
            onPress={handleAddCycle}
          >
            <CalendarIcon size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, styles.scheduleButton]}
            onPress={() => router.push('/(tabs)/training/schedule')}
          >
            <Clock size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleStartWorkout}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        <AdBanner />

        {cycles.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Training Cycles</Text>
            {cycles.map((cycle) => (
              <View key={cycle.id} style={[styles.cycleCard, { backgroundColor: colors.cardBackground }, cycle.is_active && styles.cycleCardActive]}>
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/(tabs)/training/cycle-details',
                    params: { cycleId: cycle.id }
                  })}
                  style={styles.cycleMainContent}
                >
                  <View style={styles.cycleHeader}>
                    <Text style={[styles.cycleName, { color: colors.primary }]}>{cycle.name}</Text>
                  </View>
                  <Text style={[styles.cycleType, { color: colors.text }]}>
                    {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.cycleDates, { color: colors.textSecondary }]}>
                    {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                  </Text>
                  {cycle.description && (
                    <Text style={[styles.cycleDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {cycle.description}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={styles.cycleActions}>
                  <TouchableOpacity
                    style={[styles.cycleActionButton, { backgroundColor: colors.surface }]}
                    onPress={() => handleEditCycle(cycle)}
                  >
                    <Pencil size={18} color="#2A7DE1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cycleActionButton, { backgroundColor: colors.surface }]}
                    onPress={() => handleDeleteCycle(cycle)}
                  >
                    <Trash2 size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AdMob Medium Rectangle - Automatic test/production ads */}
        <AdMediumRectangle />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Workouts</Text>
            <Text style={[styles.workoutCount, { color: colors.textSecondary }]}>
              {Math.min(displayedWorkoutsCount, allWorkouts?.length || 0)} of {allWorkouts?.length || 0}
            </Text>
          </View>
          
          {workoutsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading workouts...</Text>
            </View>
          ) : allWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Start tracking your training!</Text>
            </View>
          ) : (
            <>
              {workouts.map((workout) => (
                <TouchableOpacity 
                  key={workout.id} 
                  style={[styles.workoutCard, { backgroundColor: colors.cardBackground }]}
                  onPress={() => {
                    setViewingWorkout(workout);
                    setShowViewModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutInfo}>
                      <Text style={[styles.workoutType, { color: colors.primary }]}>
                        {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={[styles.workoutDate, { color: colors.textTertiary }]}>
                        {formatDate(workout.created_at)}
                      </Text>
                    </View>
                    <View style={styles.workoutActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditWorkout(workout);
                        }}
                      >
                        <Pencil size={18} color="#E63946" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkout(workout);
                        }}
                      >
                        <Trash2 size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.workoutDetails}>
                    <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                      {workout.duration_minutes} min
                    </Text>
                    <Text style={[styles.workoutDivider, { color: colors.textTertiary }]}>•</Text>
                    <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                      Intensity: {workout.intensity}/10
                    </Text>
                  </View>
                  {workout.notes && (
                    <Text style={[styles.workoutNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                      {workout.notes}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              
              {hasMoreWorkouts && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                  onPress={handleLoadMore}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                    Load More Workouts
                  </Text>
                  <Text style={[styles.loadMoreSubtext, { color: colors.textSecondary }]}>
                    {allWorkouts.length - displayedWorkoutsCount} remaining
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingWorkout ? 'Edit Workout' : 'Log Workout'}
            </Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 400 }}
          >
            {cycles.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Training Cycle (Optional)</Text>
                <View style={styles.typeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selectedCycleId === null && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                    ]}
                    onPress={() => setSelectedCycleId(null)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: colors.textSecondary },
                        selectedCycleId === null && [styles.typeButtonTextActive, { color: '#FFF' }],
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {cycles.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.id}
                      style={[
                        styles.typeButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedCycleId === cycle.id && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                      ]}
                      onPress={() => setSelectedCycleId(cycle.id)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          { color: colors.textSecondary },
                          selectedCycleId === cycle.id && [styles.typeButtonTextActive, { color: '#FFF' }],
                        ]}
                      >
                        {cycle.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Workout Type</Text>
            <View style={styles.typeContainer}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    workoutType === type.value && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setWorkoutType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      workoutType === type.value && [styles.typeButtonTextActive, { color: '#FFF' }],
                    ]}
                  >
                    {type.label}
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
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it go?"
              placeholderTextColor={colors.textTertiary}
            />

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={[styles.label, { color: colors.text }]}>Exercises (Optional)</Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Plus size={20} color="#E63946" />
                  <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
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
                      <Text style={[styles.smallLabel, { color: colors.text }]}>Sets</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.sets)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'sets', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.text }]}>Reps</Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        value={String(exercise.reps)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'reps', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={[styles.smallLabel, { color: colors.text }]}>
                        Weight ({profile?.weight_unit || 'lbs'})
                      </Text>
                      <TextInput
                        style={[styles.smallInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
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
                            // Store value in user's current preferred unit
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
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveWorkout}
              disabled={saving}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : editingWorkout ? 'Update Workout' : 'Save Workout'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showCycleModal}
        animationType="slide"
        onRequestClose={() => setShowCycleModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingCycle ? 'Edit Training Cycle' : 'New Training Cycle'}
            </Text>
            <TouchableOpacity onPress={() => setShowCycleModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 400 }}
          >
              <Text style={[styles.label, { color: colors.text }]}>Cycle Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={cycleName}
              onChangeText={setCycleName}
              placeholder="e.g., Competition Prep 2025"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Cycle Type</Text>
            <View style={styles.typeContainer}>
              {cycleTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    cycleType === type.value && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setCycleType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      cycleType === type.value && [styles.typeButtonTextActive, { color: '#FFF' }],
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={`${cycleStartDate.getFullYear()}-${String(cycleStartDate.getMonth() + 1).padStart(2, '0')}-${String(cycleStartDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-');
                  const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  setCycleStartDate(newDate);
                }}
                style={{
                  padding: 12,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 16,
                  marginBottom: 16,
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                >
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {cycleStartDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <CalendarIcon size={20} color={showStartDatePicker ? '#E63946' : colors.textSecondary} />
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={cycleStartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={theme === 'dark' ? 'dark' : 'light'}
                    textColor={theme === 'dark' ? '#FFFFFF' : '#000000'}
                    accentColor={theme === 'dark' ? '#E63946' : '#2A7DE1'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowStartDatePicker(false);
                      }
                      if (event.type === 'set' && selectedDate) {
                        setCycleStartDate(selectedDate);
                      } else if (event.type === 'dismissed') {
                        setShowStartDatePicker(false);
                      }
                    }}
                  />
                )}
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={`${cycleEndDate.getFullYear()}-${String(cycleEndDate.getMonth() + 1).padStart(2, '0')}-${String(cycleEndDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-');
                  const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  setCycleEndDate(newDate);
                }}
                style={{
                  padding: 12,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 16,
                  marginBottom: 16,
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowEndDatePicker(!showEndDatePicker)}
                >
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {cycleEndDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <CalendarIcon size={20} color={showEndDatePicker ? '#E63946' : colors.textSecondary} />
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={cycleEndDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={theme === 'dark' ? 'dark' : 'light'}
                    textColor={theme === 'dark' ? '#FFFFFF' : '#000000'}
                    accentColor={theme === 'dark' ? '#E63946' : '#2A7DE1'}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowEndDatePicker(false);
                      }
                      if (event.type === 'set' && selectedDate) {
                        setCycleEndDate(selectedDate);
                      } else if (event.type === 'dismissed') {
                        setShowEndDatePicker(false);
                      }
                    }}
                  />
                )}
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={cycleDescription}
              onChangeText={setCycleDescription}
              multiline
              numberOfLines={3}
              placeholder="Describe your training cycle..."
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveCycle}>
              <Save size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {editingCycle ? 'Update Cycle' : 'Create Cycle'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        feature="Unlimited workout tracking"
      />

      {/* Workout Detail View Modal */}
      <WorkoutDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#E63946',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleButton: {
    backgroundColor: '#2A7DE1',
  },
  scheduleButton: {
    backgroundColor: '#FF9500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  loadMoreButton: {
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loadMoreSubtext: {
    fontSize: 12,
  },
  cycleCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cycleCardActive: {
    borderColor: '#2A7DE1',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#2A7DE1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cycleType: {
    fontSize: 14,
    color: '#2A7DE1',
    fontWeight: '600',
    marginBottom: 4,
  },
  cycleDates: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  cycleDescription: {
    fontSize: 14,
    color: '#CCC',
    fontStyle: 'italic',
  },
  cycleMainContent: {
    flex: 1,
  },
  cycleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cycleActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  limitCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  limitText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  workoutCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetail: {
    fontSize: 14,
    color: '#CCC',
  },
  workoutDivider: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  workoutNotes: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  typeButtonActive: {
    // Styles applied inline now for dynamic colors
  },
  typeButtonText: {
    fontSize: 14,
  },
  typeButtonTextActive: {
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  dateButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  // View Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentView: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeaderView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitleView: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButtonView: {
    padding: 4,
  },
  modalBodyView: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
});
