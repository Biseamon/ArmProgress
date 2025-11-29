import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ScheduledTraining } from '@/lib/supabase';
import { scheduleTrainingNotification, cancelNotification, requestNotificationPermissions } from '@/lib/notifications';
import { Plus, X, Calendar, Clock, Bell, BellOff, Trash2, CircleCheck as CheckCircle, ArrowLeft, Pencil } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useScheduledTrainings,
  useCreateScheduledTraining,
  useUpdateScheduledTraining,
  useDeleteScheduledTraining,
  useCreateWorkout,
  useTrainingTemplates,
  useCreateExercises,
} from '@/lib/react-query-sqlite-complete';
import { handleError } from '@/lib/errorHandling';
import { convertWeight } from '@/lib/weightUtils';

export default function ScheduleScreen() {
  const { profile } = useAuth();
  const { colors, theme } = useTheme();

  // Use SQLite hooks for offline-first data
  const { data: trainings = [] } = useScheduledTrainings();
  const { data: templates = [] } = useTrainingTemplates();

  // Mutations
  const createTrainingMutation = useCreateScheduledTraining();
  const updateTrainingMutation = useUpdateScheduledTraining();
  const deleteTrainingMutation = useDeleteScheduledTraining();
  const createWorkoutMutation = useCreateWorkout();
  const createExercisesMutation = useCreateExercises();
  
  const [showModal, setShowModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<ScheduledTraining | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [minutesBefore, setMinutesBefore] = useState('30');

  // Workout modal state
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [completingTraining, setCompletingTraining] = useState<ScheduledTraining | null>(null);
  const [workoutType, setWorkoutType] = useState('table_practice');
  const [duration, setDuration] = useState('60');
  const [intensity, setIntensity] = useState('7');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Array<{
    exercise_name: string;
    sets: number;
    reps: number;
    weight_lbs: number;
    weight_unit: 'lbs' | 'kg';
    notes: string;
  }>>([]);

  const handleSave = async () => {
    if (!profile) return;

    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Training title is required.');
      return;
    }
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    if (selectedDateTime < now) {
      Alert.alert('Validation Error', 'Training date and time must be in the future.');
      return;
    }
    if (notificationEnabled) {
      const minutes = parseInt(minutesBefore);
      if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
        Alert.alert('Validation Error', 'Notification minutes before must be between 1 and 1440.');
        return;
      }
    }

    const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    let notificationId = null;
    if (notificationEnabled) {
      const { granted } = await requestNotificationPermissions();
      if (granted) {
        notificationId = await scheduleTrainingNotification(
          editingTraining?.id || 'new',
          title,
          dateString,
          timeString,
          parseInt(minutesBefore)
        );
      }
    }

    try {
      if (editingTraining) {
        if (editingTraining.notification_id && !notificationEnabled) {
          await cancelNotification(editingTraining.notification_id);
        }

        await updateTrainingMutation.mutateAsync({
          id: editingTraining.id,
          updates: {
            title,
            description: description || undefined,
            scheduled_date: dateString,
            scheduled_time: timeString,
            notification_enabled: notificationEnabled,
            notification_minutes_before: parseInt(minutesBefore),
            notification_id: notificationId,
          },
        });
      } else {
        await createTrainingMutation.mutateAsync({
          user_id: profile.id,
          title,
          description: description || undefined,
          scheduled_date: dateString,
          scheduled_time: timeString,
          notification_enabled: notificationEnabled,
          notification_minutes_before: parseInt(minutesBefore),
          notification_id: notificationId,
          completed: false,
        });
      }

      setTitle('');
      setDescription('');
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setNotificationEnabled(true);
      setMinutesBefore('30');
      setEditingTraining(null);
      setShowModal(false);
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template || !profile) return;

    // Pre-fill form with template data
    setWorkoutType(template.workout_type);
    if (template.suggested_duration_minutes) {
      setDuration(template.suggested_duration_minutes.toString());
    }
    if (template.suggested_intensity) {
      setIntensity(template.suggested_intensity.toString());
    }
    if (template.notes) {
      setWorkoutNotes(template.notes);
    }

    // Pre-fill exercises with weight conversion to user's current unit
    if (template.exercises && template.exercises.length > 0) {
      setExercises(template.exercises.map(ex => ({
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        weight_lbs: convertWeight(ex.weight_lbs, ex.weight_unit, profile.weight_unit),
        weight_unit: profile.weight_unit,
        notes: ex.notes || '',
      })));
    }

    setSelectedTemplateId(templateId);
  };

  const handleToggleComplete = async (training: ScheduledTraining) => {
    const newStatus = !training.completed;

    if (newStatus) {
      // Open workout modal to log details
      setCompletingTraining(training);
      setWorkoutNotes(`Completed scheduled training: ${training.title}${training.description ? `\n${training.description}` : ''}`);
      setShowWorkoutModal(true);
    } else {
      // Uncompleting - just update status
      try {
        await updateTrainingMutation.mutateAsync({
          id: training.id,
          updates: { completed: false },
        });
      } catch (error) {
        const errorMessage = handleError(error);
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleCompleteWorkout = async () => {
    if (!profile || !completingTraining) return;

    try {
      // Create workout
      const workoutId = await createWorkoutMutation.mutateAsync({
        user_id: profile.id,
        workout_type: workoutType,
        duration_minutes: parseInt(duration),
        intensity: parseInt(intensity),
        notes: workoutNotes,
        cycle_id: null,
        weight_unit: profile.weight_unit,
      });

      // Create exercises if any
      if (exercises.length > 0) {
        await createExercisesMutation.mutateAsync(
          exercises.map(ex => ({
            workout_id: workoutId,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            weight_lbs: ex.weight_lbs,
            weight_unit: ex.weight_unit,
            notes: ex.notes,
          }))
        );
      }

      // Mark training as completed
      await updateTrainingMutation.mutateAsync({
        id: completingTraining.id,
        updates: { completed: true },
      });

      // Cancel notification if exists
      if (completingTraining.notification_id) {
        await cancelNotification(completingTraining.notification_id);
      }

      // Reset and close
      setShowWorkoutModal(false);
      setCompletingTraining(null);
      setWorkoutType('table_practice');
      setDuration('60');
      setIntensity('7');
      setWorkoutNotes('');
      setSelectedTemplateId(null);
      setExercises([]);

      Alert.alert('Success', 'Workout logged successfully!');
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleEdit = (training: ScheduledTraining) => {
    setEditingTraining(training);
    setTitle(training.title);
    setDescription(training.description || '');
    setSelectedDate(new Date(training.scheduled_date));
    const [hours, minutes] = training.scheduled_time.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    setSelectedTime(time);
    setNotificationEnabled(training.notification_enabled);
    setMinutesBefore(training.notification_minutes_before.toString());
    setShowModal(true);
  };

  const handleDelete = async (training: ScheduledTraining) => {
    const performDelete = async () => {
      try {
        if (training.notification_id) {
          await cancelNotification(training.notification_id);
        }
        await deleteTrainingMutation.mutateAsync(training.id);
        // Data refreshes automatically via React Query
      } catch (error) {
        const errorMessage = handleError(error);
        Alert.alert('Error', errorMessage);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this scheduled training?')) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Delete Training',
        'Are you sure you want to delete this scheduled training?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Training Schedule</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowModal(true)}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {trainings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No scheduled trainings</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create your first training schedule!</Text>
          </View>
        ) : (
          trainings.map((training) => (
            <View key={training.id} style={[styles.trainingCard, { backgroundColor: colors.surface }]}>
              <View style={styles.trainingHeader}>
                <View style={styles.trainingInfo}>
                  <Text
                    style={[
                      styles.trainingTitle,
                      { color: colors.text },
                      training.completed && styles.completedText,
                    ]}
                  >
                    {training.title}
                  </Text>
                  <Text style={[styles.trainingDate, { color: colors.textSecondary }]}>
                    {new Date(training.scheduled_date).toLocaleDateString()} at{' '}
                    {training.scheduled_time}
                  </Text>
                </View>
                <View style={styles.actionIcons}>
                  <TouchableOpacity onPress={() => handleToggleComplete(training)}>
                    <CheckCircle
                      size={20}
                      color={training.completed ? '#10B981' : colors.textTertiary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(training)}>
                    <Pencil size={20} color="#2A7DE1" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(training)}>
                    <Trash2 size={20} color="#E63946" />
                  </TouchableOpacity>
                </View>
              </View>
              {!!training.description && (
                <Text style={[styles.trainingDescription, { color: colors.textSecondary }]}>{training.description}</Text>
              )}
              {!!training.notification_enabled && (
                <View style={[styles.notificationBadge, { backgroundColor: '#2A7DE144' }]}>
                  <Bell size={14} color="#2A7DE1" />
                  <Text style={styles.notificationText}>
                    {`${training.notification_minutes_before || 0} min before`}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingTraining ? 'Edit Training' : 'Schedule Training'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 400 }}
          >
            <Text style={[styles.label, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Training session name"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details about this training"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.text }]}>Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-');
                  const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  setSelectedDate(newDate);
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
                  onPress={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar size={20} color={showDatePicker ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={theme === 'dark' ? 'dark' : 'light'}
                    textColor={theme === 'dark' ? '#FFFFFF' : '#000000'}
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (event.type === 'set' && date) {
                        setSelectedDate(date);
                      } else if (event.type === 'dismissed') {
                        setShowDatePicker(false);
                      }
                    }}
                  />
                )}
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Time</Text>
            {Platform.OS === 'web' ? (
              <input
                type="time"
                value={selectedTime.toTimeString().split(' ')[0].slice(0, 5)}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':');
                  const newTime = new Date();
                  newTime.setHours(parseInt(hours), parseInt(minutes));
                  setSelectedTime(newTime);
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
                  onPress={() => setShowTimePicker(!showTimePicker)}
                >
                  <Clock size={20} color={showTimePicker ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {selectedTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={theme === 'dark' ? 'dark' : 'light'}
                    textColor={theme === 'dark' ? '#FFFFFF' : '#000000'}
                    accentColor={theme === 'dark' ? '#E63946' : '#2A7DE1'}
                    onChange={(event, time) => {
                      if (Platform.OS === 'android') {
                        setShowTimePicker(false);
                      }
                      if (event.type === 'set' && time) {
                        setSelectedTime(time);
                      } else if (event.type === 'dismissed') {
                        setShowTimePicker(false);
                      }
                    }}
                  />
                )}
              </>
            )}

            <View style={styles.notificationSection}>
              <TouchableOpacity
                style={styles.notificationToggle}
                onPress={() => setNotificationEnabled(!notificationEnabled)}
              >
                {notificationEnabled ? (
                  <Bell size={20} color={colors.secondary} />
                ) : (
                  <BellOff size={20} color={colors.textTertiary} />
                )}
                <Text style={[styles.notificationLabel, { color: colors.text }]}>Enable Notification</Text>
              </TouchableOpacity>

              {notificationEnabled && (
                <View>
                  <Text style={[styles.label, { color: colors.text }]}>Notify me (minutes before)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={minutesBefore}
                    onChangeText={setMinutesBefore}
                    placeholder="30"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{editingTraining ? 'Update Training' : 'Schedule Training'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Workout Modal */}
      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Workout</Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Template Selector */}
            {templates.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Start from Template (Optional)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[
                      styles.templateButton,
                      { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                      selectedTemplateId === null && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedTemplateId(null)}
                  >
                    <Text style={[{ color: colors.textSecondary }, selectedTemplateId === null && { color: '#FFF' }]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateButton,
                        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                        selectedTemplateId === template.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleApplyTemplate(template.id)}
                    >
                      <Text style={[{ color: colors.textSecondary }, selectedTemplateId === template.id && { color: '#FFF' }]}>
                        {template.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedTemplateId && (
                  <Text style={{ color: colors.textTertiary, fontSize: 12, fontStyle: 'italic', marginBottom: 16 }}>
                    Template applied! You can still edit any fields below.
                  </Text>
                )}
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Workout Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['table_practice', 'strength', 'technique', 'conditioning', 'endurance', 'sparring', 'recovery', 'mixed'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.templateButton,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                    workoutType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setWorkoutType(type)}
                >
                  <Text style={[{ color: colors.textSecondary }, workoutType === type && { color: '#FFF' }]}>
                    {type.replace(/_/g, ' ')}
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
              placeholder="60"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Intensity (1-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={intensity}
              onChangeText={setIntensity}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={workoutNotes}
              onChangeText={setWorkoutNotes}
              multiline
              numberOfLines={4}
              placeholder="How did the workout go?"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleCompleteWorkout}>
              <Text style={styles.saveButtonText}>Complete & Log Workout</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  trainingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trainingInfo: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  trainingDate: {
    fontSize: 14,
  },
  trainingDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A7DE144',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  notificationText: {
    fontSize: 12,
    color: '#2A7DE1',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notificationLabel: {
    fontSize: 16,
  },
  notificationSection: {
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  templateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
