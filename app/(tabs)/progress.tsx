import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Goal, StrengthTest, Workout, Cycle } from '@/lib/supabase';
import { invalidateHomeData } from '@/hooks/useHomeData';
import { AdBanner } from '@/components/AdBanner';
import { AdMediumRectangle } from '@/components/AdMediumRectangle';
import { PaywallModal } from '@/components/PaywallModal';
import { EnhancedProgressGraphs } from '@/components/EnhancedProgressGraphs';
import { ProgressReport } from '@/components/ProgressReport';
import { Confetti } from '@/components/Confetti';
import { Plus, Target, X, Save, Trophy, TrendingUp, Calendar, Pencil, Trash2, Activity, Info, Minus } from 'lucide-react-native';
import { MeasurementsModal } from '@/components/MeasurementsModal';
import { AddMeasurementModal } from '@/components/AddMeasurementModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatWeight, convertWeight } from '@/lib/weightUtils';
import { getCircumferenceUnit, convertCircumference } from '@/lib/weightUtils';
import { APP_CONFIG } from '@/lib/config';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { writeAsStringAsync, documentDirectory, cacheDirectory } from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/lib/useResponsive';
import {
  useGoals,
  useStrengthTests,
  useWorkouts,
  useCycles,
  useMeasurements,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useIncrementGoal,
  useDecrementGoal,
  useCreateStrengthTest,
  useUpdateStrengthTest,
  useDeleteStrengthTest,
  useCreateMeasurement,
  useUpdateMeasurement,
  useDeleteMeasurement,
} from '@/lib/react-query-sqlite-complete';
import { handleError } from '@/lib/errorHandling';

const { width } = Dimensions.get('window');

export default function Progress() {
  const { profile, isPremium } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  
  // Track weight unit changes to force re-render
  const [displayWeightUnit, setDisplayWeightUnit] = useState<'lbs' | 'kg'>(profile?.weight_unit || 'lbs');
  
  // Debug: Log whenever profile changes
  useEffect(() => {
    console.log('[Progress] Profile updated:', { weight_unit: profile?.weight_unit, displayWeightUnit });
  }, [profile]);
  
  // Update display weight unit when profile changes
  useEffect(() => {
    console.log('[Progress] Weight unit effect triggered:', { 
      profileUnit: profile?.weight_unit, 
      currentDisplay: displayWeightUnit,
      willUpdate: profile?.weight_unit && profile.weight_unit !== displayWeightUnit
    });
    
    if (profile?.weight_unit && profile.weight_unit !== displayWeightUnit) {
      console.log('[Progress] ✅ Updating display weight unit:', profile.weight_unit);
      setDisplayWeightUnit(profile.weight_unit);
    }
  }, [profile?.weight_unit, displayWeightUnit]);
  
  // Use SQLite hooks for offline-first data
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const { data: strengthTests = [], isLoading: testsLoading } = useStrengthTests();
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts();
  const { data: cycles = [] } = useCycles();
  const { data: measurements = [] } = useMeasurements();
  
  // Mutations
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const incrementGoalMutation = useIncrementGoal();
  const decrementGoalMutation = useDecrementGoal();
  const createTestMutation = useCreateStrengthTest();
  const updateTestMutation = useUpdateStrengthTest();
  const deleteTestMutation = useDeleteStrengthTest();
  const createMeasurementMutation = useCreateMeasurement();
  const updateMeasurementMutation = useUpdateMeasurement();
  const deleteMeasurementMutation = useDeleteMeasurement();
  
  const loading = goalsLoading || testsLoading || workoutsLoading;
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalType, setGoalType] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [goalNotes, setGoalNotes] = useState(''); // Add this line
  const [deadline, setDeadline] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [editingTest, setEditingTest] = useState<StrengthTest | null>(null);
  const [testType, setTestType] = useState('max_wrist_curl');
  const [customTestName, setCustomTestName] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testNotes, setTestNotes] = useState('');
  const [isCustomTest, setIsCustomTest] = useState(false);

  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [armCircumference, setArmCircumference] = useState('');
  const [forearmCircumference, setForearmCircumference] = useState('');
  const [wristCircumference, setWristCircumference] = useState('');
  const [measurementNotes, setMeasurementNotes] = useState('');

  const [showTestTooltip, setShowTestTooltip] = useState(false);
  const [showGoalsTooltip, setShowGoalsTooltip] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const reportRef = useRef<View>(null);

  // Data is now loaded automatically via React Query hooks - no need for fetchData

  const handleSaveMeasurement = async () => {
    if (!profile) {
      console.log('No profile found');
      return;
    }

    // Validation
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) {
      Alert.alert('Validation Error', 'Weight must be a positive number.');
      return;
    }
    if (armCircumference && (isNaN(Number(armCircumference)) || Number(armCircumference) <= 0)) {
      Alert.alert('Validation Error', 'Arm circumference must be a positive number.');
      return;
    }
    if (forearmCircumference && (isNaN(Number(forearmCircumference)) || Number(forearmCircumference) <= 0)) {
      Alert.alert('Validation Error', 'Forearm circumference must be a positive number.');
      return;
    }
    if (wristCircumference && (isNaN(Number(wristCircumference)) || Number(wristCircumference) <= 0)) {
      Alert.alert('Validation Error', 'Wrist circumference must be a positive number.');
      return;
    }

    const userUnit = profile.weight_unit || 'lbs';
    
    // IMPORTANT: Store weight in the USER'S UNIT (not converted)
    // The weight value entered is already in the user's preferred unit
    const weightValue = weight ? parseFloat(weight) : null;
    
    // Convert circumferences back to cm for storage (always stored in cm)
    const armCm = armCircumference 
      ? (userUnit === 'lbs' ? parseFloat(armCircumference) * 2.54 : parseFloat(armCircumference))
      : null;
    
    const forearmCm = forearmCircumference 
      ? (userUnit === 'lbs' ? parseFloat(forearmCircumference) * 2.54 : parseFloat(forearmCircumference))
      : null;
    
    const wristCm = wristCircumference 
      ? (userUnit === 'lbs' ? parseFloat(wristCircumference) * 2.54 : parseFloat(wristCircumference))
      : null;
  
    const measurementData = {
      user_id: profile.id,
      weight: weightValue,
      weight_unit: userUnit, // Store the unit so we know what the weight value represents
      arm_circumference: armCm,
      forearm_circumference: forearmCm,
      wrist_circumference: wristCm,
      notes: measurementNotes || null,
      measured_at: editingMeasurement?.measured_at || new Date().toISOString(),
    };
  
    console.log('Saving measurement with unit:', { ...measurementData, unit: userUnit });
  
    try {
      if (editingMeasurement) {
        // Update existing measurement
        await updateMeasurementMutation.mutateAsync({
          id: editingMeasurement.id,
          updates: measurementData,
        });
      } else {
        // Insert new measurement
        await createMeasurementMutation.mutateAsync(measurementData);
      }
    
      setWeight('');
      setArmCircumference('');
      setForearmCircumference('');
      setWristCircumference('');
      setMeasurementNotes('');
      setEditingMeasurement(null);
      setShowAddMeasurement(false);
      Alert.alert('Success', `Measurement ${editingMeasurement ? 'updated' : 'saved'} successfully!`);
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleAddGoal = () => {
      setEditingGoal(null);
      setGoalType('');
      setTargetValue('');
      setGoalNotes(''); // Add this line
      setDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      setShowGoalModal(true);
    };
  
  const handleSaveGoal = async () => {
      if (!goalType || !targetValue || !profile?.id) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }

      // Check goal limit for non-premium users when creating a new goal
      if (!editingGoal && !isPremium) {
        const activeGoalsCount = goals.filter(g => !g.is_completed).length;
        if (activeGoalsCount >= 3) {
          Alert.alert(
            'Goal Limit Reached',
            'Free users can create up to 3 active goals. Please complete or delete an existing goal, or upgrade to Premium for unlimited goals.',
            [
              { text: 'OK', style: 'cancel' },
              { text: 'Upgrade to Premium', onPress: () => {
                setShowGoalModal(false);
                setShowPaywall(true);
              }}
            ]
          );
          return;
        }
      }

      const goalData = {
        goal_type: goalType,
        target_value: parseFloat(targetValue),
        deadline: deadline.toISOString().split('T')[0],
        notes: goalNotes || null,
        user_id: profile.id,
      };

      try {
        if (editingGoal) {
          // When editing, recalculate is_completed based on new target
          // If current_value hasn't reached the new target, goal should be active again
          const isCompleted = editingGoal.current_value >= parseFloat(targetValue);
          
          await updateGoalMutation.mutateAsync({
            id: editingGoal.id,
            updates: {
              ...goalData,
              current_value: editingGoal.current_value,
              is_completed: isCompleted,
            },
          });
        } else {
          // When creating new, set initial values
          await createGoalMutation.mutateAsync({
            ...goalData,
            current_value: 0,
            is_completed: false,
          });
        }

        setShowGoalModal(false);
        // Data refreshes automatically via React Query
      } catch (error) {
        const errorMessage = handleError(error);
        Alert.alert('Error', errorMessage);
      }
    };
  
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalType(goal.goal_type);
    setTargetValue(goal.target_value.toString());
    setGoalNotes(goal.notes || ''); // Add this line
    setDeadline(goal.deadline ? new Date(goal.deadline) : new Date());
    setShowGoalModal(true);
  };

  const handleIncrementGoal = async (goal: Goal) => {
    try {
      await incrementGoalMutation.mutateAsync(goal.id);
      
      // Check if goal is now completed
      const newValue = goal.current_value + 1;
      if (newValue >= goal.target_value) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDecrementGoal = async (goal: Goal) => {
    try {
      await decrementGoalMutation.mutateAsync(goal.id);
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const performDelete = async () => {
      try {
        await deleteGoalMutation.mutateAsync(goalId);
        // Data refreshes automatically via React Query
      } catch (error) {
        const errorMessage = handleError(error);
        Alert.alert('Error', errorMessage);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this goal?')) {
        await performDelete();
      }
    } else {
      Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]);
    }
  };

  const handleToggleGoal = async (goal: Goal) => {
    // Remove the toggle functionality - goals should only complete via increment
    // Just do nothing or show info
    return;
  };

  const handleSaveTest = async () => {
    if (!profile || !testResult) {
      Alert.alert('Error', 'Please enter a test result');
      return;
    }
  
    // Validate custom test name
    if (isCustomTest && !customTestName.trim()) {
      Alert.alert('Error', 'Please enter a name for your custom PR');
      return;
    }
  
    // Validation for test result
    if (isNaN(Number(testResult)) || Number(testResult) <= 0) {
      Alert.alert('Validation Error', 'Result must be a positive number.');
      return;
    }

    const resultValue = parseFloat(testResult);
    const userUnit = profile.weight_unit || 'lbs';
    const finalTestType = isCustomTest ? customTestName.trim().toLowerCase().replace(/\s+/g, '_') : testType;
  
    const testData = {
      user_id: profile.id,
      test_type: finalTestType,
      result_value: resultValue,
      result_unit: userUnit,
      notes: testNotes || undefined,
    };
  
    try {
      // Always create a new entry (never update)
      // This preserves history for calendar and graphs
      await createTestMutation.mutateAsync(testData);
  
      setTestType('max_wrist_curl');
      setCustomTestName('');
      setIsCustomTest(false);
      setTestResult('');
      setTestNotes('');
      setEditingTest(null);
      setShowTestModal(false);
      Alert.alert('Success', 'PR saved successfully!');
      // Data refreshes automatically via React Query
    } catch (error) {
      const errorMessage = handleError(error);
      Alert.alert('Error', errorMessage);
    }
  };
  
  const handleEditTest = (test: StrengthTest) => {
    setEditingTest(test);
    
    // Check if it's a predefined test type
    const isPredefinedType = testTypes.some(t => t.value === test.test_type);
    
    if (isPredefinedType) {
      setTestType(test.test_type);
      setIsCustomTest(false);
      setCustomTestName('');
    } else {
      setTestType('custom');
      setIsCustomTest(true);
      setCustomTestName(test.test_type.replace(/_/g, ' '));
    }
    
    const userUnit = displayWeightUnit;
    const storedUnit = test.result_unit || 'lbs';
    const displayValue = convertWeight(test.result_value, storedUnit, userUnit);
    
    setTestResult(displayValue.toString());
    setTestNotes(test.notes || '');
    setShowTestModal(true);
  };

  const handleDeleteTest = async (testId: string) => {
    const performDelete = async () => {
      try {
        await deleteTestMutation.mutateAsync(testId);
        // Data refreshes automatically via React Query
      } catch (error) {
        const errorMessage = handleError(error);
        Alert.alert('Error', errorMessage);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this test?')) {
        await performDelete();
      }
    } else {
      Alert.alert('Delete PR', 'Are you sure you want to delete this test?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]);
    }
  };

  const handleEditMeasurement = (measurement: any) => {
    setEditingMeasurement(measurement);
    const userUnit = displayWeightUnit;
    const storedUnit = measurement.weight_unit || 'lbs';
    
    if (measurement.weight) {
      const displayWeight = convertWeight(measurement.weight, storedUnit, userUnit);
      setWeight(displayWeight.toString());
    } else {
      setWeight('');
    }
    
    // Convert circumferences from cm (stored) to user's preferred unit (inches if lbs)
    if (measurement.arm_circumference) {
      const displayValue = convertCircumference(measurement.arm_circumference, userUnit);
      setArmCircumference(userUnit === 'lbs' ? Math.round(displayValue).toString() : displayValue.toFixed(2));
    } else {
      setArmCircumference('');
    }
    
    if (measurement.forearm_circumference) {
      const displayValue = convertCircumference(measurement.forearm_circumference, userUnit);
      setForearmCircumference(userUnit === 'lbs' ? Math.round(displayValue).toString() : displayValue.toFixed(2));
    } else {
      setForearmCircumference('');
    }
    
    if (measurement.wrist_circumference) {
      const displayValue = convertCircumference(measurement.wrist_circumference, userUnit);
      setWristCircumference(userUnit === 'lbs' ? Math.round(displayValue).toString() : displayValue.toFixed(2));
    } else {
      setWristCircumference('');
    }
    
    if (measurement.notes) {
      setMeasurementNotes(measurement.notes);
    } else {
      setMeasurementNotes('');
    }
    
    setShowMeasurements(false);
    setShowAddMeasurement(true);
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    const performDelete = async () => {
      try {
        await deleteMeasurementMutation.mutateAsync(measurementId);
        // Data refreshes automatically via React Query
      } catch (error) {
        const errorMessage = handleError(error);
        Alert.alert('Error', errorMessage);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this measurement?')) {
        await performDelete();
      }
    } else {
      Alert.alert('Delete Measurement', 'Are you sure you want to delete this measurement?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]);
    }
  };

  const testTypes = [
    { value: 'max_wrist_curl', label: 'Max Wrist Curl' },
    { value: 'max_grip_strength', label: 'Max Grip Strength' },
    { value: 'pronation_strength', label: 'Pronation Strength' },
    { value: 'supination_strength', label: 'Supination Strength' },
    { value: 'endurance_test', label: 'Endurance Test' },
    { value: 'custom', label: '+ Custom PR' },
  ];

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getLatestPRsByType = () => {
    const prsByType: { [key: string]: StrengthTest } = {};
    
    // Group by test_type and keep only the latest
    strengthTests.forEach(test => {
      if (!prsByType[test.test_type] || 
          new Date(test.created_at) > new Date(prsByType[test.test_type].created_at)) {
        prsByType[test.test_type] = test;
      }
    });
    
    return Object.values(prsByType).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const renderTestTooltipModal = () => (
    <Modal
      visible={showTestTooltip}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTestTooltip(false)}
    >
      <TouchableOpacity 
        style={styles.tooltipModalOverlay}
        activeOpacity={1}
        onPress={() => setShowTestTooltip(false)}
      >
        <View style={[styles.tooltipModal, { backgroundColor: colors.surface }]}>
          <View style={styles.tooltipHeader}>
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>
              💪 Personal Records Tracking
            </Text>
            <TouchableOpacity onPress={() => setShowTestTooltip(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.tooltipDescription, { color: colors.textSecondary }]}>
            Track your Personal Records! You can use predefined PR types or create{' '}
            <Text style={{ fontWeight: 'bold', color: colors.primary }}>custom ones</Text>.
            Each update creates a new timestamped entry, preserving your complete history.
          </Text>

          <View style={[styles.tooltipTip, { backgroundColor: colors.background }]}>
            <Text style={[styles.tooltipTipLabel, { color: colors.primary }]}>💡 How It Works:</Text>
            <Text style={[styles.tooltipTipText, { color: colors.textSecondary }]}>
              • The PR list shows your latest result for each type{'\n'}
              • Click the 📈 icon to update and add a new entry{'\n'}
              • All entries are preserved for graphs and calendar{'\n'}
              • Create custom PRs for any exercise you track
            </Text>
          </View>

          <View style={[styles.tooltipExample, { backgroundColor: colors.background }]}>
            <Text style={[styles.tooltipExampleLabel, { color: '#10B981' }]}>✅ Example:</Text>
            <Text style={[styles.tooltipExampleText, { color: colors.textSecondary }]}>
              Max Grip - Latest: 120 lbs (Feb 1){'\n'}
              History: 100 lbs → 110 lbs → 120 lbs{'\n'}
              All dates visible in calendar & graphs
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.tooltipCloseButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowTestTooltip(false)}
          >
            <Text style={styles.tooltipCloseButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderGoalsTooltipModal = () => (
    <Modal
      visible={showGoalsTooltip}
      transparent
      animationType="fade"
      onRequestClose={() => setShowGoalsTooltip(false)}
    >
      <TouchableOpacity 
        style={styles.tooltipModalOverlay}
        activeOpacity={1}
        onPress={() => setShowGoalsTooltip(false)}
      >
        <View style={[styles.tooltipModal, { backgroundColor: colors.surface }]}>
          <View style={styles.tooltipHeader}>
            <Text style={[styles.tooltipTitle, { color: colors.text }]}>
              🎯 Goals Tracking
            </Text>
            <TouchableOpacity onPress={() => setShowGoalsTooltip(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.tooltipDescription, { color: colors.textSecondary }]}>
            Set and track your training goals! Goals help you stay motivated and measure progress toward specific targets.
          </Text>

          <View style={[styles.tooltipTip, { backgroundColor: colors.background }]}>
            <Text style={[styles.tooltipTipLabel, { color: colors.primary }]}>💡 How It Works:</Text>
            <Text style={[styles.tooltipTipText, { color: colors.textSecondary }]}>
              • Create goals with a description, target value, and deadline{'\n'}
              • Track progress manually with the + button{'\n'}
              • Toggle completion status by tapping the goal card{'\n'}
              • Edit or delete goals with the action buttons{'\n'}
              • Free users can create one cycle at a time.
            </Text>
          </View>

          <View style={[styles.tooltipExample, { backgroundColor: colors.background }]}>
            <Text style={[styles.tooltipExampleLabel, { color: '#10B981' }]}>✅ Examples:</Text>
            <Text style={[styles.tooltipExampleText, { color: colors.textSecondary }]}>
              • "Complete 20 workouts" - Target: 20{'\n'}
              • "Win 5 matches" - Target: 5{'\n'}
              • "Train 3x per week for 8 weeks" - Target: 24{'\n'}
              🏆 Goals turn gold when completed!
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.tooltipCloseButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowGoalsTooltip(false)}
          >
            <Text style={styles.tooltipCloseButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const generateReportData = () => {
    // Filter data from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentWorkouts = workouts.filter(w => new Date(w.created_at) > threeMonthsAgo);
    const recentTests = strengthTests.filter(t => new Date(t.created_at) > threeMonthsAgo);
    const recentMeasurements = measurements.filter(m => 
      new Date(m.measured_at || m.created_at) > threeMonthsAgo
    );
    
    const latestPRs = getLatestPRsByType();
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.is_completed).length;
    
    // Calculate workout frequency (last 30 days within the 3-month period)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysWorkouts = recentWorkouts.filter(w => new Date(w.created_at) > thirtyDaysAgo);
    
    // Calculate average intensity from recent workouts
    const avgIntensity = recentWorkouts.length > 0
      ? recentWorkouts.reduce((sum, w) => sum + (w.intensity || 0), 0) / recentWorkouts.length
      : 0;
    
    // Calculate total training time from recent workouts
    const totalMinutes = recentWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    
    // Get latest measurements for each type
    const latestWeight = recentMeasurements
      .filter(m => m.weight)
      .sort((a, b) => new Date(b.measured_at || b.created_at).getTime() - new Date(a.measured_at || a.created_at).getTime())[0];
    
    const latestArm = recentMeasurements
      .filter(m => m.arm_circumference)
      .sort((a, b) => new Date(b.measured_at || b.created_at).getTime() - new Date(a.measured_at || a.created_at).getTime())[0];
    
    const latestForearm = recentMeasurements
      .filter(m => m.forearm_circumference)
      .sort((a, b) => new Date(b.measured_at || b.created_at).getTime() - new Date(a.measured_at || a.created_at).getTime())[0];
    
    const latestWrist = recentMeasurements
      .filter(m => m.wrist_circumference)
      .sort((a, b) => new Date(b.measured_at || b.created_at).getTime() - new Date(a.measured_at || a.created_at).getTime())[0];
    
    // Get oldest measurements for comparison (from 3 months ago)
    const oldestWeight = recentMeasurements
      .filter(m => m.weight)
      .sort((a, b) => new Date(a.measured_at || a.created_at).getTime() - new Date(b.measured_at || b.created_at).getTime())[0];

    // Get oldest measurements for other types
    const oldestArm = recentMeasurements
      .filter(m => m.arm_circumference)
      .sort((a, b) => new Date(a.measured_at || a.created_at).getTime() - new Date(b.measured_at || b.created_at).getTime())[0];

    const oldestForearm = recentMeasurements
      .filter(m => m.forearm_circumference)
      .sort((a, b) => new Date(a.measured_at || a.created_at).getTime() - new Date(b.measured_at || b.created_at).getTime())[0];

    const oldestWrist = recentMeasurements
      .filter(m => m.wrist_circumference)
      .sort((a, b) => new Date(a.measured_at || a.created_at).getTime() - new Date(b.measured_at || b.created_at).getTime())[0];

    // Get active cycles
    const activeCycles = cycles.filter(c => c.is_active);

    return {
      totalWorkouts: recentWorkouts.length,
      totalHours,
      recentWorkouts: last30DaysWorkouts.length,
      avgIntensity,
      latestPRs: latestPRs.filter(pr => recentTests.some(t => t.id === pr.id)),
      latestWeight,
      latestArm,
      latestForearm,
      latestWrist,
      oldestWeight,
      oldestArm,
      oldestForearm,
      oldestWrist,
      totalGoals,
      completedGoals,
      activeCycles,
      generatedAt: new Date().toLocaleDateString(),
      userUnit: displayWeightUnit,
      periodStart: threeMonthsAgo.toLocaleDateString(),
    };
  };

  const generateHTMLReport = (reportData: ReturnType<typeof generateReportData>) => {
    const calculateChange = (latest: number | null, oldest: number | null) => {
      if (!latest || !oldest) return null;
      const change = ((latest - oldest) / oldest) * 100;
      return change;
    };
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Progress Report - ${reportData.generatedAt}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 100%);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(42, 42, 42, 0.9);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #E63946;
        }
        h1 {
            font-size: 32px;
            color: #E63946;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #999;
            font-size: 14px;
        }
        .period {
            color: #FFD700;
            font-size: 12px;
            margin-top: 8px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .stat-card {
            background: rgba(230, 57, 70, 0.1);
            border: 1px solid rgba(230, 57, 70, 0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #E63946;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 12px;
            color: #999;
            text-transform: 'uppercase';
        }
        .change {
            font-size: 11px;
            margin-top: 5px;
        }
        .change-positive { color: #10B981; }
        .change-negative { color: #EF4444; }
        .section {
            margin: 30px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
        }
        .section-title {
            font-size: 20px;
            margin-bottom: 15px;
            color: #E63946;
        }
        .pr-list {
            display: grid;
            gap: 10px;
        }
        .pr-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .pr-name {
            font-weight: 600;
            text-transform: 'uppercase';
            font-size: 14px;
        }
        .pr-value {
            font-size: 18px;
            color: #E63946;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .app-link {
            display: inline-block;
            background: #E63946;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 15px;
            transition: transform 0.2s;
        }
        .app-link:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💪 My Progress Report</h1>
            <p class="subtitle">Report generated on ${reportData.generatedAt}</p>
            <p class="period">📅 Last 3 Months (${reportData.periodStart} - ${reportData.generatedAt})</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${reportData.totalWorkouts}</div>
                <div class="stat-label">Total Workouts</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${reportData.totalHours}h</div>
                <div class="stat-label">Training Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${reportData.recentWorkouts}</div>
                <div class="stat-label">Last 30 Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${reportData.avgIntensity.toFixed(1)}/10</div>
                <div class="stat-label">Avg Intensity</div>
            </div>
        </div>

        ${reportData.latestPRs.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🏆 Personal Records</h2>
            <div class="pr-list">
                ${reportData.latestPRs.slice(0, 4).map(pr => {
                  const userUnit = reportData.userUnit;
                  const storedUnit = pr.result_unit || 'lbs';
                  const displayValue = Math.round(convertWeight(pr.result_value, storedUnit, userUnit));
                  return `
                    <div class="pr-item">
                        <span class="pr-name">${pr.test_type.replace(/_/g, ' ')}</span>
                        <span class="pr-value">${displayValue} ${userUnit}</span>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
        ` : ''}

        ${reportData.latestWeight || reportData.latestArm || reportData.latestForearm || reportData.latestWrist ? `
        <div class="section">
            <h2 class="section-title">📏 Body Measurements Progress</h2>
            <div class="stats-grid">
                ${reportData.latestWeight ? `
                <div class="stat-card">
                    <div class="stat-value">${Math.round(convertWeight(reportData.latestWeight.weight!, reportData.latestWeight.weight_unit || 'lbs', reportData.userUnit))}</div>
                    <div class="stat-label">Weight (${reportData.userUnit})</div>
                    ${(() => {
                      const change = calculateChange(
                        reportData.latestWeight?.weight ? convertWeight(reportData.latestWeight.weight, reportData.latestWeight.weight_unit || 'lbs', reportData.userUnit) : null,
                        reportData.oldestWeight?.weight ? convertWeight(reportData.oldestWeight.weight, reportData.oldestWeight.weight_unit || 'lbs', reportData.userUnit) : null
                      );
                      return change !== null 
                        ? `<div class="change ${change >= 0 ? 'change-positive' : 'change-negative'}">${change >= 0 ? '+' : ''}${change.toFixed(1)}% (3mo)</div>` 
                        : '';
                    })()}
                </div>
                ` : ''}
                ${reportData.latestArm ? `
                <div class="stat-card">
                    <div class="stat-value">${reportData.userUnit === 'lbs' 
                      ? Math.round(convertCircumference(reportData.latestArm.arm_circumference!, reportData.userUnit))
                      : reportData.latestArm.arm_circumference!.toFixed(1)
                    }</div>
                    <div class="stat-label">Arm (${getCircumferenceUnit(reportData.userUnit)})</div>
                    ${(() => {
                      const change = calculateChange(
                        reportData.latestArm?.arm_circumference ?? null,
                        reportData.oldestArm?.arm_circumference ?? null
                      );
                      return change !== null 
                        ? `<div class="change ${change >= 0 ? 'change-positive' : 'change-negative'}">${change >= 0 ? '+' : ''}${change.toFixed(1)}% (3mo)</div>` 
                        : '';
                    })()}
                </div>
                ` : ''}
                ${reportData.latestForearm ? `
                <div class="stat-card">
                    <div class="stat-value">${reportData.userUnit === 'lbs' 
                      ? Math.round(convertCircumference(reportData.latestForearm.forearm_circumference!, reportData.userUnit))
                      : reportData.latestForearm.forearm_circumference!.toFixed(1)
                    }</div>
                    <div class="stat-label">Forearm (${getCircumferenceUnit(reportData.userUnit)})</div>
                    ${(() => {
                      const change = calculateChange(
                        reportData.latestForearm?.forearm_circumference ?? null,
                        reportData.oldestForearm?.forearm_circumference ?? null
                      );
                      return change !== null 
                        ? `<div class="change ${change >= 0 ? 'change-positive' : 'change-negative'}">${change >= 0 ? '+' : ''}${change.toFixed(1)}% (3mo)</div>` 
                        : '';
                    })()}
                </div>
                ` : ''}
                ${reportData.latestWrist ? `
                <div class="stat-card">
                    <div class="stat-value">${reportData.userUnit === 'lbs' 
                      ? Math.round(convertCircumference(reportData.latestWrist.wrist_circumference!, reportData.userUnit))
                      : reportData.latestWrist.wrist_circumference!.toFixed(2)
                    }</div>
                    <div class="stat-label">Wrist (${getCircumferenceUnit(reportData.userUnit)})</div>
                    ${(() => {
                      const change = calculateChange(
                        reportData.latestWrist?.wrist_circumference ?? null,
                        reportData.oldestWrist?.wrist_circumference ?? null
                      );
                      return change !== null 
                        ? `<div class="change ${change >= 0 ? 'change-positive' : 'change-negative'}">${change >= 0 ? '+' : ''}${change.toFixed(1)}% (3mo)</div>` 
                        : '';
                    })()}
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">🎯 Goals Progress</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${reportData.completedGoals}/${reportData.totalGoals}</div>
                    <div class="stat-label">Goals Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${reportData.totalGoals > 0 ? Math.round((reportData.completedGoals / reportData.totalGoals) * 100) : 0}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
            </div>
        </div>

        ${reportData.activeCycles.length > 0 ? `
        <div class="section">
            <h2 class="section-title">🔄 Active Training Cycles</h2>
            ${reportData.activeCycles.map(cycle => `
                <div class="pr-item">
                    <span class="pr-name">${cycle.name}</span>
                    <span style="color: #10B981;">Active</span>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p style="color: #999; margin-bottom: 10px;">Track your arm wrestling journey</p>
            <a href="${APP_CONFIG.url}" class="app-link">
                💪 Get the App
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 15px;">
                Made with ArmProgress
            </p>
        </div>
    </div>
</body>
</html>
    `;
  };

const handleShareReport = async (type: 'pdf' | 'social') => {
  if (!profile) return;
  
  setGeneratingReport(true);
  
  try {
    if (type === 'social') {
      // First, copy URL to clipboard
      await Clipboard.setStringAsync(APP_CONFIG.url || 'https://armprogress.com');
      
      // Show alert that URL is copied
      Alert.alert(
        '🔗 Link Copied!',
        'The app link has been copied to your clipboard.\n\nPaste it as your caption when sharing!',
        [
          {
            text: 'Continue to Share',
            onPress: async () => {
              // Now proceed with image sharing
              if (!reportRef.current) {
                Alert.alert('Error', 'Report not ready. Please try again.');
                setGeneratingReport(false);
                return;
              }

              await new Promise(resolve => setTimeout(resolve, 300));

              const uri = await captureRef(reportRef.current, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
              });
              
              if (await isAvailableAsync()) {
                await shareAsync(uri, {
                  mimeType: 'image/png',
                  dialogTitle: 'Share Your Progress (paste the link as caption)',
                  UTI: 'public.png',
                });
              } else {
                Alert.alert('Error', 'Sharing is not available on this device');
              }
              
              setGeneratingReport(false);
              setShowReportModal(false);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setGeneratingReport(false);
            }
          }
        ]
      );
      return; // Exit early to wait for user confirmation
    } else if (type === 'pdf') {
      // Generate HTML report and open in browser for PDF export
      const reportData = generateReportData();
      const htmlContent = generateHTMLReport(reportData);
      
      const fileName = `progress-report-${Date.now()}.html`;
      const docDir = documentDirectory || cacheDirectory;
      
      if (!docDir) {
        Alert.alert('Error', 'File system not available');
        return;
      }
      
      const htmlPath = docDir + fileName;
      
      await writeAsStringAsync(htmlPath, htmlContent);
      
      if (Platform.OS === 'web') {
        window.open(htmlPath, '_blank');
      } else {
        if (await isAvailableAsync()) {
          await shareAsync(htmlPath, {
            mimeType: 'text/html',
            dialogTitle: 'Open in browser to save as PDF',
            UTI: 'public.html',
          });
        } else {
          Alert.alert('Error', 'Cannot open file. Please use a file manager to open the HTML file in your browser.');
        }
      }
    }
    
    setShowReportModal(false);
  } catch (error: any) {
    console.error('Error generating report:', error);
    Alert.alert('Error', `Failed to generate report: ${error.message || 'Unknown error'}`);
  } finally {
    setGeneratingReport(false);
  }
};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Confetti active={showConfetti} />
      {renderTestTooltipModal()}
      {renderGoalsTooltipModal()}

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => {
            if (!isPremium) {
              setShowPaywall(true);
            } else {
              setShowReportModal(true);
            }
          }}
        >
          <Activity size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <AdBanner />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics</Text>
          <EnhancedProgressGraphs
            workouts={workouts}
            strengthTests={strengthTests}
            measurements={measurements}
            cycles={cycles}
            weightUnit={displayWeightUnit}
            isPremium={isPremium}
            onUpgrade={() => setShowPaywall(true)}
            key={`graphs-${isPremium ? 'premium' : 'free'}-${strengthTests.length}-${displayWeightUnit}`}
          />
        </View>

        {/* AdMob Medium Rectangle - Automatic test/production ads */}
        <AdMediumRectangle />

        <View style={styles.section} key={`measurements-${displayWeightUnit}`}>
          <TouchableOpacity
            style={[styles.measurementsCard, { backgroundColor: colors.surface }]}
            onPress={() => setShowMeasurements(true)}
          >
            <View style={styles.measurementsHeader}>
              <View style={styles.measurementsTitle}>
                <Activity size={24} color="#E63946" />
                <Text style={[styles.measurementsTitleText, { color: colors.primary }]}>Body Measurements</Text>
              </View>
              <Text style={[styles.measurementsCount, { color: colors.textSecondary }]}>{measurements.length} entries</Text>
            </View>
            {measurements.length > 0 && measurements[0] && (
              <View style={styles.latestMeasurement}>
                <Text style={styles.latestLabel}>Latest:</Text>
                <View style={styles.latestStats}>
                  {measurements[0].weight && (
                    <Text style={[styles.latestStat, { color: colors.text }]}>
                      Weight: {Math.round(convertWeight(
                        measurements[0].weight,
                        measurements[0].weight_unit || 'lbs',
                        displayWeightUnit
                      ))} {displayWeightUnit}
                    </Text>
                  )}
                  {measurements[0].arm_circumference && (
                    <Text style={[styles.latestStat, { color: colors.text }]}>
                      Arm: {displayWeightUnit === 'lbs' 
                        ? Math.round(convertCircumference(measurements[0].arm_circumference, displayWeightUnit))
                        : convertCircumference(measurements[0].arm_circumference, displayWeightUnit).toFixed(1)
                      }{getCircumferenceUnit(displayWeightUnit)}
                    </Text>
                  )}
                  {measurements[0].forearm_circumference && (
                    <Text style={[styles.latestStat, { color: colors.text }]}>
                      Forearm: {displayWeightUnit === 'lbs' 
                        ? Math.round(convertCircumference(measurements[0].forearm_circumference, displayWeightUnit))
                        : convertCircumference(measurements[0].forearm_circumference, displayWeightUnit).toFixed(1)
                      }{getCircumferenceUnit(displayWeightUnit)}
                    </Text>
                  )}
                  {measurements[0].wrist_circumference && (
                    <Text style={[styles.latestStat, { color: colors.text }]}>
                      Wrist: {displayWeightUnit === 'lbs' 
                        ? Math.round(convertCircumference(measurements[0].wrist_circumference, displayWeightUnit))
                        : convertCircumference(measurements[0].wrist_circumference, displayWeightUnit).toFixed(1)
                      }{getCircumferenceUnit(displayWeightUnit)}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowGoalsTooltip(true)}
              >
                <Info size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {!isPremium && (
            <Text style={styles.limitText}>Free: {goals.filter(g => !g.is_completed).length}/3 active goals</Text>
          )}

          {goals.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Target size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No goals yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Set your first training goal!</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: colors.surface },
                  goal.is_completed && styles.goalCardCompleted,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      {goal.is_completed && (
                        <Trophy size={20} color="#FFD700" style={styles.goalIcon} />
                      )}
                      <Text
                        style={[
                          styles.goalType,
                          { color: colors.primary },
                          goal.is_completed && styles.goalTypeCompleted,
                        ]}
                      >
                        {goal.goal_type?.trim() || 'Goal'}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.editButton, { marginRight: 8 }]}
                        onPress={() => handleEditGoal(goal)}
                      >
                        <Pencil size={16} color="#2A7DE1" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 size={16} color="#E63946" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {goal.deadline && (
                    <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
                      {new Date(goal.deadline).toLocaleDateString()}
                    </Text>
                  )}
                  {goal.notes && goal.notes.trim() && (
                    <Text style={[styles.goalNotesText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {goal.notes}
                    </Text>
                  )}
                  <View style={styles.goalProgressRow}>
                    <Text style={[styles.goalProgress, { color: colors.text }]}>
                      {goal.current_value} / {goal.target_value}
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {/* Show minus button if current_value > 0 */}
                      {!goal.is_completed && goal.current_value > 0 && (
                        <TouchableOpacity
                          style={[styles.decrementButton, { marginRight: 8 }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDecrementGoal(goal);
                          }}
                        >
                          <Minus size={16} color="#FFF" />
                        </TouchableOpacity>
                      )}
                      {!goal.is_completed && goal.current_value < goal.target_value && (
                        <TouchableOpacity
                          style={styles.incrementButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleIncrementGoal(goal);
                          }}
                        >
                          <Plus size={16} color="#FFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  {/* Use a light bar container for progress bar */}
                  <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.progressBar,
                        goal.is_completed && styles.progressFillCompleted,
                        { width: `${getProgressPercentage(goal)}%`, backgroundColor: colors.secondary }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.secondary }]}>
                    {Math.round(getProgressPercentage(goal))}% complete
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section} key={`prs-${displayWeightUnit}`}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Records</Text>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowTestTooltip(true)}
              >
                <Info size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingTest(null);
                setTestType('max_wrist_curl');
                setCustomTestName('');
                setIsCustomTest(false);
                setTestResult('');
                setTestNotes('');
                setShowTestModal(true);
              }}
            >
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {getLatestPRsByType().length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <TrendingUp size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No PRs recorded</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Track your strength progress!</Text>
            </View>
          ) : (
            getLatestPRsByType().map((test) => {
              const userUnit = displayWeightUnit;
              const storedUnit = test.result_unit || 'lbs';
              const displayValue = convertWeight(test.result_value, storedUnit, userUnit);
              
              // Count how many entries for this PR type
              const historyCount = strengthTests.filter(t => t.test_type === test.test_type).length;
              
              return (
                <View key={test.id} style={[styles.testCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.testHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.testType, { color: colors.text }]}>
                        {test.test_type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      {historyCount > 1 && (
                        <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
                          {historyCount} entries
                        </Text>
                      )}
                    </View>
                    <View style={styles.testActions}>
                      <TouchableOpacity onPress={() => handleEditTest(test)}>
                        <TrendingUp size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteTest(test.id)}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.testResult, { color: colors.primary }]}>
                    {formatWeight(displayValue, userUnit)}
                  </Text>
                  {test.notes && (
                    <Text style={[styles.testNotes, { color: colors.textSecondary }]}>
                      {test.notes}
                    </Text>
                  )}
                  <Text style={[styles.testDate, { color: colors.textSecondary }]}>
                    Latest: {new Date(test.created_at).toLocaleDateString()}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showGoalModal}
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingGoal ? 'Edit Goal' : 'New Goal'}</Text>
            <TouchableOpacity onPress={() => {
              setShowGoalModal(false);
              setEditingGoal(null);
              setGoalType('');
              setTargetValue('');
              setGoalNotes('');
            }}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={goalType}
              onChangeText={setGoalType}
              placeholder="e.g., Win 10 matches"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Target Value</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={goalNotes}
              onChangeText={setGoalNotes}
              multiline
              numberOfLines={3}
              placeholder="Add details about this goal..."
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Deadline</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowDeadlinePicker(!showDeadlinePicker)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {deadline.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Calendar size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showDeadlinePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={theme === 'dark' ? 'light' : 'dark'}
                accentColor={theme === 'dark' ? '#E63946' : '#2A2A2A'}
                textColor={theme === 'dark' ? '#FFFFFF' : '#000000'}
                onChange={(event, selectedDate) => {
                  setShowDeadlinePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDeadline(selectedDate);
                  }
                }}
              />
            )}

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveGoal}>
              <Save size={20} color="#FFF" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Save Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showTestModal}
        animationType="slide"
        onRequestClose={() => {
          setShowTestModal(false);
          setEditingTest(null);
          setTestType('max_wrist_curl');
          setCustomTestName('');
          setIsCustomTest(false);
          setTestResult('');
          setTestNotes('');
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingTest ? 'Update PR' : 'Record PR'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowTestModal(false);
              setEditingTest(null);
              setTestType('max_wrist_curl');
              setCustomTestName('');
              setIsCustomTest(false);
              setTestResult('');
              setTestNotes('');
            }}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {editingTest && (
              <View style={[styles.updateNotice, { backgroundColor: '#2A7DE144', borderColor: '#2A7DE1' }]}>
                <Text style={[styles.updateNoticeText, { color: colors.text }]}>
                  💡 Updating will create a new entry while preserving your history for graphs and calendar tracking.
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>PR Type</Text>
            <View style={styles.typeContainer}>
              {testTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    (testType === type.value || (type.value === 'custom' && isCustomTest)) && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    if (type.value === 'custom') {
                      setIsCustomTest(true);
                      setTestType('custom');
                    } else {
                      setIsCustomTest(false);
                      setTestType(type.value);
                      setCustomTestName('');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: colors.textSecondary },
                      (testType === type.value || (type.value === 'custom' && isCustomTest)) && [styles.typeButtonTextActive, { color: '#FFF' }],
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {isCustomTest && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Custom PR Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={customTestName}
                  onChangeText={setCustomTestName}
                  placeholder="e.g., Pinch Grip, Thick Bar Curl"
                  placeholderTextColor={colors.textTertiary}
                  editable={!editingTest}
                />
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Result ({displayWeightUnit})</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={testResult}
              onChangeText={setTestResult}
              keyboardType="decimal-pad"
              placeholder="100"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={testNotes}
              onChangeText={setTestNotes}
              multiline
              numberOfLines={3}
              placeholder="How did it feel?"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveTest}>
              <Save size={20} color="#FFF" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>{editingTest ? 'Update PR' : 'Save PR'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showReportModal}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Progress Report</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <X size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            <View
              ref={reportRef}
              collapsable={false}
              style={[styles.reportContainer, { backgroundColor: colors.surface }]}
            >
              {/* Report Header */}
              <View style={styles.reportHeader}>
                <Text style={[styles.reportTitle, { color: colors.primary }]}>
                  💪 Progress Summary
                </Text>
                <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
                  Generated on {new Date().toLocaleDateString()}
                </Text>
                <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
                  Last 3 Months
                </Text>
              </View>

              {/* Key Stats */}
              <View style={styles.reportStatsGrid}>
                <View style={[styles.reportStatCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.reportStatValue, { color: colors.primary }]}>
                    {(() => {
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      return workouts.filter(w => new Date(w.created_at) > threeMonthsAgo).length;
                    })()}
                  </Text>
                  <Text style={[styles.reportStatLabel, { color: colors.textSecondary }]}>
                    Workouts
                  </Text>
                </View>
                
                <View style={[styles.reportStatCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.reportStatValue, { color: colors.primary }]}>
                    {(() => {
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      const recentWorkouts = workouts.filter(w => new Date(w.created_at) > threeMonthsAgo);
                      const totalMinutes = recentWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
                      return Math.floor(totalMinutes / 60);
                    })()}h
                  </Text>
                  <Text style={[styles.reportStatLabel, { color: colors.textSecondary }]}>
                    Training Time
                  </Text>
                </View>
                
                <View style={[styles.reportStatCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.reportStatValue, { color: colors.primary }]}>
                    {(() => {
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      return strengthTests.filter(t => new Date(t.created_at) > threeMonthsAgo).length;
                    })()}
                  </Text>
                  <Text style={[styles.reportStatLabel, { color: colors.textSecondary }]}>
                    PRs Set
                  </Text>
                </View>
                
                <View style={[styles.reportStatCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.reportStatValue, { color: colors.primary }]}>
                    {goals.filter(g => g.is_completed).length}/{goals.length}
                  </Text>
                  <Text style={[styles.reportStatLabel, { color: colors.textSecondary }]}>
                    Goals
                  </Text>
                </View>
              </View>

              {/* PRs Section */}
              {getLatestPRsByType().length > 0 && (
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                    🏆 Personal Records
                  </Text>
                  {getLatestPRsByType().slice(0, 4).map((test) => {
                    const userUnit = displayWeightUnit;
                    const storedUnit = test.result_unit || 'lbs';
                    const displayValue = Math.round(convertWeight(test.result_value, storedUnit, userUnit));
                    
                    return (
                      <View key={test.id} style={[styles.reportPRItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.reportPRName, { color: colors.text }]}>
                          {test.test_type.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        <Text style={[styles.reportPRValue, { color: colors.primary }]}>
                          {displayValue} {userUnit}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Goals Section */}
              <View style={styles.reportSection}>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  🎯 Goals Progress
                </Text>
                <View style={styles.reportStatsRow}>
                  <View style={[styles.reportStatCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.reportStatValue, { color: colors.primary }]}>
                      {goals.filter(g => g.is_completed).length}/{goals.length}
                    </Text>
                    <Text style={[styles.reportStatLabel, { color: colors.textSecondary }]}>
                      Completed
                    </Text>
                  </View>
                  <View style={[styles.reportStatCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.reportStatValue, { color: colors.primary }]}>
                      {goals.length > 0 
                        ? Math.round((goals.filter(g => g.is_completed).length / goals.length) * 100)
                        : 0}%
                    </Text>
                    <Text style={[styles.reportStatLabel, { color: colors.textSecondary }]}>
                      Success Rate
                    </Text>
                  </View>
                </View>
              </View>

              {/* Body Measurements */}
              {measurements.length > 0 && (
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                    📏 Latest Measurements
                  </Text>
                  {measurements[0].weight && (
                    <View style={[styles.reportPRItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.reportPRName, { color: colors.text }]}>Weight</Text>
                      <Text style={[styles.reportPRValue, { color: colors.primary }]}>
                        {Math.round(convertWeight(
                          measurements[0].weight,
                          measurements[0].weight_unit || 'lbs',
                          displayWeightUnit
                        ))} {displayWeightUnit}
                      </Text>
                    </View>
                  )}
                  {measurements[0].arm_circumference && (
                    <View style={[styles.reportPRItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.reportPRName, { color: colors.text }]}>Arm</Text>
                      <Text style={[styles.reportPRValue, { color: colors.primary }]}>
                        {displayWeightUnit === 'lbs'
                          ? Math.round(convertCircumference(measurements[0].arm_circumference, displayWeightUnit))
                          : convertCircumference(measurements[0].arm_circumference, displayWeightUnit).toFixed(1)
                        } {getCircumferenceUnit(displayWeightUnit)}
                      </Text>
                    </View>
                  )}
                  {measurements[0].forearm_circumference && (
                    <View style={[styles.reportPRItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.reportPRName, { color: colors.text }]}>Forearm</Text>
                      <Text style={[styles.reportPRValue, { color: colors.primary }]}>
                        {displayWeightUnit === 'lbs'
                          ? Math.round(convertCircumference(measurements[0].forearm_circumference, displayWeightUnit))
                          : convertCircumference(measurements[0].forearm_circumference, displayWeightUnit).toFixed(1)
                        } {getCircumferenceUnit(displayWeightUnit)}
                      </Text>
                    </View>
                  )}
                  {measurements[0].wrist_circumference && (
                    <View style={[styles.reportPRItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.reportPRName, { color: colors.text }]}>Wrist</Text>
                      <Text style={[styles.reportPRValue, { color: colors.primary }]}>
                        {displayWeightUnit === 'lbs'
                          ? Math.round(convertCircumference(measurements[0].wrist_circumference, displayWeightUnit))
                          : convertCircumference(measurements[0].wrist_circumference, displayWeightUnit).toFixed(1)
                        } {getCircumferenceUnit(displayWeightUnit)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Active Cycles */}
              {cycles.filter(c => c.is_active).length > 0 && (
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                    🔄 Active Cycles
                  </Text>
                  {cycles.filter(c => c.is_active).map((cycle) => (
                    <View key={cycle.id} style={[styles.reportPRItem, { backgroundColor: colors.background }]}>
                      <Text style={[styles.reportPRName, { color: colors.text }]}>
                        {cycle.name}
                      </Text>
                      <Text style={[styles.reportPRValue, { color: '#10B981' }]}>
                        Active
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Footer */}
              <View style={styles.reportFooter}>
                <Text style={[styles.reportFooterText, { color: colors.textSecondary }]}>
                  Generated by
                </Text>
                <Text style={[styles.reportAppName, { color: colors.primary }]}>
                  ArmProgress
                </Text>
              </View>
            </View>

            {/* Share Options */}
            <View style={styles.shareOptions}>
              <Text style={[styles.shareTitle, { color: colors.text }]}>Share Your Progress</Text>
              
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: '#4267B2' }]}
                onPress={() => handleShareReport('social')}
                disabled={generatingReport}
              >
                <Text style={styles.shareButtonText}>
                  {generatingReport ? '⏳ Generating...' : '📱 Share as Image'}
                </Text>
                <Text style={styles.shareButtonSubtext}>
                  Share as PNG image (Instagram, Facebook, X, TikTok, etc.)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: '#E63946' }]}
                onPress={() => handleShareReport('pdf')}
                disabled={generatingReport}
              >
                <Text style={styles.shareButtonText}>
                  📄 Export as PDF
                </Text>
                <Text style={styles.shareButtonSubtext}>
                  Opens HTML in browser (use Print → Save as PDF)
                </Text>
              </TouchableOpacity>
                       </View>
          </ScrollView>
        </View>
      </Modal>

      <ProgressReport
        visible={showReport}
        onClose={() => setShowReport(false)}
        strengthTests={strengthTests}
        workouts={workouts}
        goals={goals}
        weightUnit={displayWeightUnit}
      />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => setShowPaywall(false)}
        feature="Progress Reports"
      />

      <MeasurementsModal
        visible={showMeasurements}
        onClose={() => setShowMeasurements(false)}
        measurements={measurements as any}
        onAddNew={() => {
          setEditingMeasurement(null);
          setWeight('');
          setArmCircumference('');
          setForearmCircumference('');
          setWristCircumference('');
          setMeasurementNotes('');
          setShowMeasurements(false);
          setShowAddMeasurement(true);
        }}
        onEdit={handleEditMeasurement}
        onDelete={handleDeleteMeasurement}
        weightUnit={displayWeightUnit}
      />

      <AddMeasurementModal
        visible={showAddMeasurement}
        onClose={() => {
          setShowAddMeasurement(false);
          setEditingMeasurement(null);
        }}
               onSave={handleSaveMeasurement}
        weight={weight}
        setWeight={setWeight}
        armCircumference={armCircumference}
        setArmCircumference={setArmCircumference}
        forearmCircumference={forearmCircumference}
        setForearmCircumference={setForearmCircumference}
        wristCircumference={wristCircumference}
        setWristCircumference={setWristCircumference}
        notes={measurementNotes}
        setNotes={setMeasurementNotes}
        weightUnit={displayWeightUnit}
        isEditing={!!editingMeasurement}
      />
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
  testActions: {
    flexDirection: 'row',
  },
  reportButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
   section: {
    marginBottom: 24,
  },
  measurementsCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E63946',
  },
  measurementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  measurementsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementsTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  measurementsCount: {
    fontSize: 14,
    color: '#999',
  },
  latestMeasurement: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  latestLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  latestStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  latestStat: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginRight: 12,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
       fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#E63946',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize:  14,
    marginTop: 4,
  },
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalCardCompleted: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    marginRight: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goalTypeCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#999',
  },
  goalNotesText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
    marginBottom: 8,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalProgress: {
    fontSize: 14,
    color: '#CCC',
  },
  incrementButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    backgroundColor: '#999',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  // Add this style for the light bar container
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressFillCompleted: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  testCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E63946',
  },
  testDate: {
    fontSize: 12,
    color: '#999',
  },
  testResult: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  testNotes: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#2A7DE144',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#E6394644',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  typeButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: {
    // Dynamic styles applied inline
  },
  typeButtonText: {
    fontSize: 14,
  },
  typeButtonTextActive: {
    fontWeight: 'bold',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
  tooltipModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  tooltipModal: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tooltipDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  tooltipTip: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tooltipTipLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tooltipTipText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tooltipExample: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tooltipExampleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  tooltipExampleText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tooltipCloseButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  tooltipCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  historyCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  updateNotice: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  updateNoticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  reportContainer: {
    padding: 20,
    borderRadius: 12,
    margin: 10,
    minHeight: 'auto', // Allow full height for capture
  },
   reportHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#E63946',
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reportDate: {
    fontSize: 12,
  },
  reportStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  reportStatsRow: {
    flexDirection: 'row',
  },
  reportStatCard: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 5,
  },
  reportStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reportStatLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  reportSection: {
    marginBottom: 20,
  },
  reportSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reportPRItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportPRName: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportPRValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  reportFooterText: {
    fontSize: 12,
    marginBottom: 5,
  },
  reportAppName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareOptions: {
    padding: 20,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shareButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shareButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});