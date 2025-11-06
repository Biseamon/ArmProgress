import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/contexts/ThemeContext';
import { Workout, StrengthTest } from '@/lib/supabase';
import { formatWeight } from '@/lib/weightUtils';

interface EnhancedProgressGraphsProps {
  workouts: Workout[];
  strengthTests: StrengthTest[];
  weightUnit: 'kg' | 'lbs';
  isPremium: boolean;
}

export function EnhancedProgressGraphs({
  workouts,
  strengthTests,
  weightUnit,
  isPremium,
}: EnhancedProgressGraphsProps) {
  const { colors } = useTheme();
  const [selectedGraph, setSelectedGraph] = useState<'strength' | 'endurance' | 'intensity' | 'volume'>('strength');

  const screenWidth = Dimensions.get('window').width - 40;

  // Process strength data - FIX THE CONVERSION
  const strengthData = strengthTests
    .filter((test) => test.test_type === 'max_wrist_curl')
    .slice(0, 10)
    .reverse();

  const strengthLabels = strengthData.map((_, index) => `T${index + 1}`);
  const strengthValues = strengthData.map((test) => {
    // The test.result_value is ALWAYS stored in lbs in the database
    if (weightUnit === 'kg') {
      // Convert from lbs to kg for display
      return test.result_value * 0.453592; // More accurate conversion
    }
    // If displaying in lbs, use the stored value directly
    return test.result_value;
  });

  // Process endurance data
  const enduranceData = workouts
    .filter((workout) => workout.duration_minutes > 0)
    .slice(0, 15)
    .reverse();

  const enduranceLabels = enduranceData.map((_, index) => `W${index + 1}`);
  const enduranceValues = enduranceData.map((workout) => workout.duration_minutes);

  // Process intensity data (average intensity per workout)
  const intensityData = workouts
    .filter((workout) => workout.intensity > 0)
    .slice(0, 15)
    .reverse();

  const intensityLabels = intensityData.map((_, index) => `W${index + 1}`);
  const intensityValues = intensityData.map((workout) => workout.intensity);

  // Process training volume (total exercises × sets × reps per workout)
  const volumeData = workouts
    .filter((workout) => workout.exercises && workout.exercises.length > 0)
    .slice(0, 15)
    .reverse();

  const volumeLabels = volumeData.map((_, index) => `W${index + 1}`);
  const volumeValues = volumeData.map((workout) => {
    if (!workout.exercises) return 0;
    return workout.exercises.reduce((total: number, exercise: any) => {
      return total + (exercise.sets * exercise.reps);
    }, 0);
  });

  const getChartWidth = (dataPoints: number) => {
    const minWidth = screenWidth;
    const pointSpacing = 60;
    const calculatedWidth = dataPoints * pointSpacing;
    return Math.max(minWidth, calculatedWidth);
  };

  const strengthChartWidth = getChartWidth(strengthData.length);
  const enduranceChartWidth = getChartWidth(enduranceData.length);
  const intensityChartWidth = getChartWidth(intensityData.length);
  const volumeChartWidth = getChartWidth(volumeData.length);

  const getChartConfig = (graphType: string) => ({
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: graphType === 'intensity' ? 1 : 0,
    color: (opacity = 1) => {
      switch (graphType) {
        case 'strength':
          return `rgba(230, 57, 70, ${opacity})`; // Red
        case 'endurance':
          return `rgba(42, 125, 225, ${opacity})`; // Blue
        case 'intensity':
          return `rgba(255, 165, 0, ${opacity})`; // Orange
        case 'volume':
          return `rgba(16, 185, 129, ${opacity})`; // Green
        default:
          return `rgba(230, 57, 70, ${opacity})`;
      }
    },
    labelColor: (opacity = 1) => colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: graphType === 'strength' ? colors.primary :
             graphType === 'endurance' ? '#2A7DE1' :
             graphType === 'intensity' ? '#FFA500' : '#10B981',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  });

  if (strengthData.length === 0 && enduranceData.length === 0 && 
      intensityData.length === 0 && volumeData.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No data yet. Complete workouts and tests to see your progress!
        </Text>
      </View>
    );
  }

  const calculateAverage = (values: number[]) => {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0;
    const lastValue = values[values.length - 1];
    const firstValue = values[0];
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Graph Type Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.selectorScroll}
      >
        <View style={styles.selector}>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedGraph === 'strength' && styles.selectorButtonActive,
              { backgroundColor: selectedGraph === 'strength' ? '#E63946' : colors.surface }
            ]}
            onPress={() => setSelectedGraph('strength')}
          >
            <Text
              style={[
                styles.selectorText,
                { color: selectedGraph === 'strength' ? '#FFF' : colors.textSecondary }
              ]}
            >
              💪 Strength
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedGraph === 'endurance' && styles.selectorButtonActive,
              { backgroundColor: selectedGraph === 'endurance' ? '#2A7DE1' : colors.surface }
            ]}
            onPress={() => setSelectedGraph('endurance')}
          >
            <Text
              style={[
                styles.selectorText,
                { color: selectedGraph === 'endurance' ? '#FFF' : colors.textSecondary }
              ]}
            >
              ⏱️ Duration
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedGraph === 'intensity' && styles.selectorButtonActive,
              { backgroundColor: selectedGraph === 'intensity' ? '#FFA500' : colors.surface }
            ]}
            onPress={() => setSelectedGraph('intensity')}
          >
            <Text
              style={[
                styles.selectorText,
                { color: selectedGraph === 'intensity' ? '#FFF' : colors.textSecondary }
              ]}
            >
              🔥 Intensity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedGraph === 'volume' && styles.selectorButtonActive,
              { backgroundColor: selectedGraph === 'volume' ? '#10B981' : colors.surface }
            ]}
            onPress={() => setSelectedGraph('volume')}
          >
            <Text
              style={[
                styles.selectorText,
                { color: selectedGraph === 'volume' ? '#FFF' : colors.textSecondary }
              ]}
            >
              📊 Volume
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Strength Graph */}
      {selectedGraph === 'strength' && strengthData.length > 0 && (
        <View style={styles.graphContainer}>
          <Text style={[styles.graphTitle, { color: colors.text }]}>
            Max Wrist Curl Progress
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <LineChart
              data={{
                labels: strengthLabels,
                datasets: [{ data: strengthValues.length > 0 ? strengthValues : [0] }],
              }}
              width={strengthChartWidth}
              height={220}
              chartConfig={getChartConfig('strength')}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              fromZero={false}
              segments={4}
            />
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatWeight(strengthValues[strengthValues.length - 1] || 0, weightUnit)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatWeight(calculateAverage(strengthValues), weightUnit)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trend</Text>
              <Text style={[styles.statValue, { color: calculateTrend(strengthValues) >= 0 ? '#10B981' : '#EF4444' }]}>
                {calculateTrend(strengthValues).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Endurance Graph */}
      {selectedGraph === 'endurance' && enduranceData.length > 0 && (
        <View style={styles.graphContainer}>
          <Text style={[styles.graphTitle, { color: colors.text }]}>
            Workout Duration Trend
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <LineChart
              data={{
                labels: enduranceLabels,
                datasets: [{ data: enduranceValues.length > 0 ? enduranceValues : [0] }],
              }}
              width={enduranceChartWidth}
              height={220}
              chartConfig={getChartConfig('endurance')}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              fromZero={false}
              segments={4}
            />
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {enduranceValues[enduranceValues.length - 1] || 0} min
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.round(calculateAverage(enduranceValues))} min
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {enduranceValues.reduce((a, b) => a + b, 0)} min
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Intensity Graph */}
      {selectedGraph === 'intensity' && intensityData.length > 0 && (
        <View style={styles.graphContainer}>
          <Text style={[styles.graphTitle, { color: colors.text }]}>
            Training Intensity Trend
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <LineChart
              data={{
                labels: intensityLabels,
                datasets: [{ data: intensityValues.length > 0 ? intensityValues : [0] }],
              }}
              width={intensityChartWidth}
              height={220}
              chartConfig={getChartConfig('intensity')}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              fromZero={true}
              segments={4}
              yAxisSuffix="/10"
            />
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {intensityValues[intensityValues.length - 1] || 0}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {calculateAverage(intensityValues).toFixed(1)}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Peak</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.max(...intensityValues)}/10
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            Track how hard you're pushing yourself each session
          </Text>
        </View>
      )}

      {/* Volume Graph */}
      {selectedGraph === 'volume' && volumeData.length > 0 && (
        <View style={styles.graphContainer}>
          <Text style={[styles.graphTitle, { color: colors.text }]}>
            Training Volume (Sets × Reps)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <LineChart
              data={{
                labels: volumeLabels,
                datasets: [{ data: volumeValues.length > 0 ? volumeValues : [0] }],
              }}
              width={volumeChartWidth}
              height={220}
              chartConfig={getChartConfig('volume')}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              fromZero={false}
              segments={4}
            />
          </ScrollView>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Latest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {volumeValues[volumeValues.length - 1] || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.round(calculateAverage(volumeValues))}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.max(...volumeValues)}
              </Text>
            </View>
          </View>
          <Text style={[styles.graphNote, { color: colors.textSecondary }]}>
            Total reps performed across all exercises
          </Text>
        </View>
      )}

      {/* Empty states */}
      {selectedGraph === 'strength' && strengthData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No strength tests recorded yet. Add a max wrist curl test to track your progress!
          </Text>
        </View>
      )}

      {selectedGraph === 'endurance' && enduranceData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workout duration data yet. Log workouts to see your endurance trends!
          </Text>
        </View>
      )}

      {selectedGraph === 'intensity' && intensityData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No intensity data yet. Rate your workout intensity to track training load!
          </Text>
        </View>
      )}

      {selectedGraph === 'volume' && volumeData.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No volume data yet. Add exercises to your workouts to track training volume!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorScroll: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  selectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  selectorButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  graphContainer: {
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  scrollView: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingRight: 20,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  graphNote: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
