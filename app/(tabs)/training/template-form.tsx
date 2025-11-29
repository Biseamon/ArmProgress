import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TemplateExercise } from '@/lib/supabase';
import { Plus, X, Save, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateTrainingTemplate, getFirstError } from '@/lib/validation';
import { handleError } from '@/lib/errorHandling';
import {
  useTrainingTemplate,
  useCreateTrainingTemplate,
  useUpdateTrainingTemplate,
} from '@/lib/react-query-sqlite-complete';

type Exercise = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  weight_unit: 'lbs' | 'kg';
  notes?: string;
};

const WORKOUT_TYPES = [
  { value: 'table_practice', label: 'Table Practice' },
  { value: 'strength', label: 'Strength' },
  { value: 'technique', label: 'Technique' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'sparring', label: 'Sparring' },
];

export default function TemplateForm() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const templateId = params.templateId as string | undefined;

  // Fetch template data if editing
  const { data: existingTemplate, isLoading } = useTrainingTemplate(templateId || '');

  // Mutations
  const createTemplateMutation = useCreateTrainingTemplate();
  const updateTemplateMutation = useUpdateTrainingTemplate();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workoutType, setWorkoutType] = useState('table_practice');
  const [suggestedDuration, setSuggestedDuration] = useState('');
  const [suggestedIntensity, setSuggestedIntensity] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setDescription(existingTemplate.description || '');
      setWorkoutType(existingTemplate.workout_type);
      setSuggestedDuration(existingTemplate.suggested_duration_minutes?.toString() || '');
      setSuggestedIntensity(existingTemplate.suggested_intensity?.toString() || '');
      setNotes(existingTemplate.notes || '');
      setExercises(existingTemplate.exercises || []);
    }
  }, [existingTemplate]);

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        exercise_name: '',
        sets: 3,
        reps: 10,
        weight_lbs: 0,
        weight_unit: profile?.weight_unit || 'lbs',
        notes: '',
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      // Validate template data
      const templateValidation = validateTrainingTemplate({
        name,
        description,
        workout_type: workoutType,
        suggested_duration_minutes: suggestedDuration ? parseInt(suggestedDuration) : undefined,
        suggested_intensity: suggestedIntensity ? parseInt(suggestedIntensity) : undefined,
        exercises,
        notes,
      });

      if (!templateValidation.isValid) {
        Alert.alert('Validation Error', getFirstError(templateValidation) || 'Invalid template data');
        setSaving(false);
        return;
      }

      const templateData = {
        user_id: profile.id,
        name,
        description: description || null,
        workout_type: workoutType,
        suggested_duration_minutes: suggestedDuration ? parseInt(suggestedDuration) : null,
        suggested_intensity: suggestedIntensity ? parseInt(suggestedIntensity) : null,
        exercises: exercises as TemplateExercise[],
        notes: notes || null,
      };

      if (templateId) {
        // Update existing template
        await updateTemplateMutation.mutateAsync({
          id: templateId,
          updates: templateData,
        });
      } else {
        // Create new template
        await createTemplateMutation.mutateAsync(templateData);
      }

      router.back();
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && templateId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading template...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {templateId ? 'Edit Template' : 'New Template'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, { opacity: saving ? 0.5 : 1 }]}
        >
          <Save size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Template Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Template Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Tuesday Strength Workout"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of this template..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Workout Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Workout Type *</Text>
          <View style={styles.typeGrid}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: workoutType === type.value ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => setWorkoutType(type.value)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: workoutType === type.value ? '#FFF' : colors.text },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested Duration & Intensity */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Duration (min)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              value={suggestedDuration}
              onChangeText={setSuggestedDuration}
              placeholder="e.g., 60"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Intensity (1-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
              value={suggestedIntensity}
              onChangeText={setSuggestedIntensity}
              placeholder="e.g., 7"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes or tips..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
            <TouchableOpacity
              onPress={handleAddExercise}
              style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {exercises.map((exercise, index) => (
            <View
              key={index}
              style={[styles.exerciseCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseNumber, { color: colors.textSecondary }]}>
                  Exercise {index + 1}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.exerciseInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={exercise.exercise_name}
                onChangeText={(value) => handleUpdateExercise(index, 'exercise_name', value)}
                placeholder="Exercise name"
                placeholderTextColor={colors.textTertiary}
              />

              <View style={styles.exerciseRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.exerciseLabel, { color: colors.textSecondary }]}>Sets</Text>
                  <TextInput
                    style={[styles.exerciseInputSmall, { backgroundColor: colors.cardBackground, color: colors.text }]}
                    value={exercise.sets.toString()}
                    onChangeText={(value) => handleUpdateExercise(index, 'sets', parseInt(value) || 0)}
                    keyboardType="number-pad"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 4 }}>
                  <Text style={[styles.exerciseLabel, { color: colors.textSecondary }]}>Reps</Text>
                  <TextInput
                    style={[styles.exerciseInputSmall, { backgroundColor: colors.cardBackground, color: colors.text }]}
                    value={exercise.reps.toString()}
                    onChangeText={(value) => handleUpdateExercise(index, 'reps', parseInt(value) || 0)}
                    keyboardType="number-pad"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.exerciseLabel, { color: colors.textSecondary }]}>
                    Weight ({exercise.weight_unit})
                  </Text>
                  <TextInput
                    style={[styles.exerciseInputSmall, { backgroundColor: colors.cardBackground, color: colors.text }]}
                    value={exercise.weight_lbs.toString()}
                    onChangeText={(value) => handleUpdateExercise(index, 'weight_lbs', parseFloat(value) || 0)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <TextInput
                style={[styles.exerciseInput, { backgroundColor: colors.cardBackground, color: colors.text }]}
                value={exercise.notes || ''}
                onChangeText={(value) => handleUpdateExercise(index, 'notes', value)}
                placeholder="Exercise notes (optional)"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          ))}

          {exercises.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises added yet. Tap "Add Exercise" to begin.
            </Text>
          )}
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addExerciseButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  exerciseLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseInputSmall: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    padding: 24,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
