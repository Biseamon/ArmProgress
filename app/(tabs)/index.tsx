import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Workout } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { Calendar, TrendingUp, Target, Clock } from 'lucide-react-native';

export default function Home() {
  const { profile, isPremium } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalMinutes: 0,
    avgIntensity: 0,
  });

  const fetchWorkouts = async () => {
    if (!profile) return;

    const [recentWorkouts, allWorkouts] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
    ]);

    if (recentWorkouts.data) {
      setWorkouts(recentWorkouts.data);
    }

    if (allWorkouts.data) {
      calculateStats(allWorkouts.data);
    }
  };

  const calculateStats = (workoutData: Workout[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekWorkouts = workoutData.filter(
      (w) => new Date(w.created_at) > weekAgo
    );

    const totalMinutes = workoutData.reduce(
      (sum, w) => sum + w.duration_minutes,
      0
    );

    const avgIntensity =
      workoutData.length > 0
        ? workoutData.reduce((sum, w) => sum + w.intensity, 0) / workoutData.length
        : 0;

    setStats({
      totalWorkouts: workoutData.length,
      thisWeek: thisWeekWorkouts.length,
      totalMinutes,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchWorkouts().finally(() => setLoading(false));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchWorkouts();
      }
    }, [profile])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E63946" />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'Athlete'}</Text>
        </View>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      <AdBanner />

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Target size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <Calendar size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.thisWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statCard}>
          <Clock size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.totalMinutes}</Text>
          <Text style={styles.statLabel}>Total Minutes</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={24} color="#E63946" />
          <Text style={styles.statValue}>{stats.avgIntensity}</Text>
          <Text style={styles.statLabel}>Avg Intensity</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your arm wrestling training!
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutType}>
                  {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.workoutDate}>{formatDate(workout.created_at)}</Text>
              </View>
              <View style={styles.workoutDetails}>
                <Text style={styles.workoutDetail}>
                  {workout.duration_minutes} min
                </Text>
                <Text style={styles.workoutDivider}>•</Text>
                <Text style={styles.workoutDetail}>
                  Intensity: {workout.intensity}/10
                </Text>
              </View>
              {workout.notes && (
                <Text style={styles.workoutNotes} numberOfLines={2}>
                  {workout.notes}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  greeting: {
    fontSize: 16,
    color: '#999',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E63946',
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
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
  bottomSpacing: {
    height: 20,
  },
});
