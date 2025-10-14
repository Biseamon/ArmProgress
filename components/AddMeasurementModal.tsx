import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { X, Save } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  weight: string;
  setWeight: (value: string) => void;
  armCircumference: string;
  setArmCircumference: (value: string) => void;
  forearmCircumference: string;
  setForearmCircumference: (value: string) => void;
  wristCircumference: string;
  setWristCircumference: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  weightUnit: string;
};

export function AddMeasurementModal({
  visible,
  onClose,
  onSave,
  weight,
  setWeight,
  armCircumference,
  setArmCircumference,
  forearmCircumference,
  setForearmCircumference,
  wristCircumference,
  setWristCircumference,
  notes,
  setNotes,
  weightUnit,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Measurement</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>All fields are optional. Enter measurements to track your progress.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight ({weightUnit})</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder={`e.g., ${weightUnit === 'lbs' ? '180' : '80'}`}
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Arm Circumference (cm)</Text>
            <TextInput
              style={styles.input}
              value={armCircumference}
              onChangeText={setArmCircumference}
              placeholder="e.g., 35"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Forearm Circumference (cm)</Text>
            <TextInput
              style={styles.input}
              value={forearmCircumference}
              onChangeText={setForearmCircumference}
              placeholder="e.g., 28"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wrist Circumference (cm)</Text>
            <TextInput
              style={styles.input}
              value={wristCircumference}
              onChangeText={setWristCircumference}
              placeholder="e.g., 17"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this measurement..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Save size={20} color="#FFF" />
            <Text style={styles.saveButtonText}>Save Measurement</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
