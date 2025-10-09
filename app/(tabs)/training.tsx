import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { PaywallModal } from '@/components/PaywallModal';
import { Plus, X, Save } from 'lucide-react-native';

type Exercise = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string;
};

export default function Training() {
  const { profile, isPremium } = useAuth();
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const [workoutType, setWorkoutType] = useState('table_practice');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState('5');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetchWorkoutCount();
  }, [profile]);

  const fetchWorkoutCount = async () => {
    if (!profile) return;

    const { count } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    setWorkoutCount(count || 0);
  };

  const handleStartWorkout = () => {
    if (!isPremium && workoutCount >= 5) {
      setShowPaywall(true);
      return;
    }
    setShowWorkoutModal(true);
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { exercise_name: '', sets: 3, reps: 10, weight_lbs: 0, notes: '' },
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

  const handleSaveWorkout = async () => {
    if (!profile) return;

    setSaving(true);

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: profile.id,
        workout_type: workoutType,
        duration_minutes: parseInt(duration) || 0,
        intensity: parseInt(intensity) || 5,
        notes,
      })
      .select()
      .single();

    if (workoutError || !workout) {
      setSaving(false);
      return;
    }

    if (exercises.length > 0) {
      const exercisesData = exercises.map((ex) => ({
        workout_id: workout.id,
        ...ex,
      }));

      await supabase.from('exercises').insert(exercisesData);
    }

    setSaving(false);
    setShowWorkoutModal(false);
    resetForm();
    fetchWorkoutCount();
  };

  const resetForm = () => {
    setWorkoutType('table_practice');
    setDuration('30');
    setIntensity('5');
    setNotes('');
    setExercises([]);
  };

  const workoutTypes = [
    { value: 'table_practice', label: 'Table Practice' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'technique', label: 'Technique' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'sparring', label: 'Sparring' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Training</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleStartWorkout}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <AdBanner />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Quick Tips</Text>
          <Text style={styles.infoText}>
            • Warm up properly before intense training
          </Text>
          <Text style={styles.infoText}>• Focus on technique over strength</Text>
          <Text style={styles.infoText}>• Rest adequately between sessions</Text>
          <Text style={styles.infoText}>
            • Track your progress consistently
          </Text>
        </View>

        {!isPremium && (
          <View style={styles.limitCard}>
            <Text style={styles.limitText}>
              Free: {workoutCount}/5 workouts tracked
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowPaywall(true)}
            >
              <Text style={styles.upgradeText}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Exercises</Text>
          {[
            'Wrist Curls',
            'Pronation/Supination',
            'Top Roll Practice',
            'Hook Practice',
            'Strap Pulls',
            'Cable Pulls',
          ].map((exercise) => (
            <View key={exercise} style={styles.exerciseItem}>
              <Text style={styles.exerciseText}>{exercise}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Workout Type</Text>
            <View style={styles.typeContainer}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    workoutType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setWorkoutType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      workoutType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Intensity (1-10)</Text>
            <TextInput
              style={styles.input}
              value={intensity}
              onChangeText={setIntensity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it go?"
              placeholderTextColor="#666"
            />

            <View style={styles.exercisesSection}>
              <View style={styles.exercisesHeader}>
                <Text style={styles.label}>Exercises (Optional)</Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Plus size={20} color="#E63946" />
                  <Text style={styles.addExerciseText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>

              {exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseCardHeader}>
                    <Text style={styles.exerciseCardTitle}>
                      Exercise {index + 1}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                      <X size={20} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={exercise.exercise_name}
                    onChangeText={(val) =>
                      handleUpdateExercise(index, 'exercise_name', val)
                    }
                    placeholder="Exercise name"
                    placeholderTextColor="#666"
                  />

                  <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.smallLabel}>Sets</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={String(exercise.sets)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'sets', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.smallLabel}>Reps</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={String(exercise.reps)}
                        onChangeText={(val) =>
                          handleUpdateExercise(index, 'reps', parseInt(val) || 0)
                        }
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseInputGroup}>
                      <Text style={styles.smallLabel}>Weight (lbs)</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={String(exercise.weight_lbs)}
                        onChangeText={(val) =>
                          handleUpdateExercise(
                            index,
                            'weight_lbs',
                            parseInt(val) || 0
                          )
                        }
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
                {saving ? 'Saving...' : 'Save Workout'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          setShowPaywall(false);
        }}
        feature="Unlimited workout tracking"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#E63946',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 8,
    lineHeight: 20,
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
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  exerciseItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  exerciseText: {
    fontSize: 14,
    color: '#CCC',
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
});
