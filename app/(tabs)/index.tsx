// This is the home screen for Arm Wrestling Pro.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Cycle } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { AdMediumRectangle } from '@/components/AdMediumRectangle';
import { Calendar, TrendingUp, Target, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/lib/useResponsive';
import { useHomeData } from '@/hooks/useHomeData';

export default function Home() {
  const { profile, isPremium } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Use custom hook with caching - replaces all manual fetching!
  const { data: homeData, isLoading: loading, refetch } = useHomeData(profile?.id);

  // Reset avatar error when profile avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url]);

  // Extract data from hook result (with fallbacks)
  const workouts = homeData?.recentWorkouts || [];
  const cycles = homeData?.cycles || [];
  const completedGoals = homeData?.completedGoals || [];
  const scheduledTrainings = homeData?.scheduledTrainings || [];
  const activeGoals = homeData?.activeGoals || [];
  const stats = homeData?.stats || {
    totalWorkouts: 0,
    thisWeek: 0,
    totalMinutes: 0,
    avgIntensity: 0,
    viewAll: {
      fontSize: 14,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCycleDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCycleProgress = (cycle: Cycle) => {
    const now = new Date();
    const start = new Date(cycle.start_date);
    const end = new Date(cycle.end_date);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getProgressPercentage = (goal: any) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 20, paddingHorizontal: isTablet ? 40 : 20 }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.appLogoContainer, isTablet && styles.appLogoContainerTablet]}>
            <Image
              source={require('@/assets/images/app-logo.png')}
              style={styles.appLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={[styles.avatarContainer, isTablet && styles.avatarContainerTablet]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              {profile?.avatar_url && !avatarError ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  key={`home-avatar-${profile.avatar_url}`}
                  onError={(e) => {
                    console.log('Home avatar load error:', e.nativeEvent.error);
                    setAvatarError(true);
                  }}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.avatarPlaceholderText, isTablet && styles.avatarPlaceholderTextTablet]}>
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={[styles.greeting, { color: colors.textTertiary }, isTablet && styles.greetingTablet]}>Welcome back,</Text>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.text }, isTablet && styles.nameTablet]} numberOfLines={1}>
                  {profile?.full_name || 'Athlete'}
                </Text>
                {isPremium && (
                  <View style={[styles.premiumBadge, { backgroundColor: colors.premium }, isTablet && styles.premiumBadgeTablet]}>
                    <Text style={[styles.premiumText, isTablet && styles.premiumTextTablet]}>PRO</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      <AdBanner />

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, minWidth: isTablet ? '30%' : '45%' }]}>
          <Target size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Workouts</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, minWidth: isTablet ? '30%' : '45%' }]}>
          <Calendar size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.thisWeek}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>This Week</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, minWidth: isTablet ? '30%' : '45%' }]}>
          <Clock size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalMinutes}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total Minutes</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, minWidth: isTablet ? '30%' : '45%' }]}>
          <TrendingUp size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.avgIntensity}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Avg Intensity</Text>
        </View>
      </View>

      {/* AdMob Medium Rectangle - Automatic test/production ads */}
      <AdMediumRectangle />

      {/* Active Goals Section */}
      {activeGoals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Goals</Text>
            <TouchableOpacity onPress={() => router.push('/progress')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {activeGoals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/progress')}
              activeOpacity={0.7}
            >
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Target size={20} color={colors.primary} />
                  <Text style={[styles.goalType, { color: colors.text }]}>
                    {goal.goal_type}
                  </Text>
                </View>
                {goal.deadline && (
                  <Text style={[styles.goalDeadline, { color: colors.textSecondary }]}>
                    Due: {new Date(goal.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </View>
              <Text style={[styles.goalProgress, { color: colors.textSecondary }]}>
                {goal.current_value} / {goal.target_value}
              </Text>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${getProgressPercentage(goal)}%`, backgroundColor: colors.secondary }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {Math.round(getProgressPercentage(goal))}% complete
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {scheduledTrainings.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Trainings</Text>
          {scheduledTrainings.map((training) => (
            <TouchableOpacity
              key={training.id}
              style={[styles.trainingCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                router.push('/(tabs)/training');
                setTimeout(() => router.push('/(tabs)/training/schedule'), 100);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.trainingHeader}>
                <Text style={[styles.trainingTitle, { color: colors.text }]}>
                  {training.title}
                </Text>
                <Text style={[styles.trainingDate, { color: colors.primary }]}>
                  {new Date(training.scheduled_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.trainingDetails}>
                <Text style={[styles.trainingTime, { color: colors.textSecondary }]}>
                  ⏰ {training.scheduled_time.slice(0, 5)}
                </Text>
                {training.notification_enabled && (
                  <Text style={[styles.trainingNotif, { color: colors.secondary }]}>
                    🔔 {training.notification_minutes_before}m before
                  </Text>
                )}
              </View>
              {training.description && (
                <Text style={[styles.trainingDescription, { color: colors.textTertiary }]} numberOfLines={2}>
                  {training.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {cycles.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Training Cycles</Text>
          {cycles.map((cycle) => (
            <TouchableOpacity
              key={cycle.id}
              style={[styles.cycleCard, { backgroundColor: colors.surface, borderColor: cycle.is_active ? colors.secondary : 'transparent' }]}
              onPress={() => router.push({
                pathname: '/(tabs)/training/cycle-details',
                params: { cycleId: cycle.id }
              })}
              activeOpacity={0.7}
            >
              <View style={styles.cycleHeader}>
                <Text style={[styles.cycleName, { color: colors.text }]}>{cycle.name}</Text>
              </View>
              <Text style={[styles.cycleType, { color: colors.secondary }]}>
                {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Text style={[styles.cycleDates, { color: colors.textTertiary }]}>
                {formatCycleDate(cycle.start_date)} - {formatCycleDate(cycle.end_date)}
              </Text>
              {cycle.description && (
                <Text style={[styles.cycleDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {cycle.description}
                </Text>
              )}
              <View style={[styles.progressBarContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.progressBar, { width: `${getCycleProgress(cycle)}%`, backgroundColor: colors.secondary }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.secondary }]}>
                {Math.round(getCycleProgress(cycle))}% complete
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Completed</Text>
          <TouchableOpacity onPress={() => router.push('/progress')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        {completedGoals.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No completed goals yet
            </Text>
          </View>
        ) : (
          completedGoals.map((goal) => (
            <View
              key={goal.id}
              style={[styles.completedGoalCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.completedGoalHeader}>
                <Text style={[styles.completedGoalEmoji]}>🎯</Text>
                <Text style={[styles.completedGoalType, { color: colors.primary }]}>
                  {goal.goal_type}
                </Text>
              </View>
              <Text style={[styles.completedGoalText, { color: colors.success }]}>
                ✓ Completed
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/training')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Start tracking your arm wrestling training!
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={[styles.workoutCard, { backgroundColor: colors.surface }]}>
              <View style={styles.workoutHeader}>
                <Text style={[styles.workoutType, { color: colors.primary }]}>
                  {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.workoutDate, { color: colors.textTertiary }]}>{formatDate(workout.created_at)}</Text>
              </View>
              <View style={styles.workoutDetails}>
                <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                  {workout.duration_minutes} min
                </Text>
                <Text style={[styles.workoutDivider, { color: colors.border }]}>•</Text>
                <Text style={[styles.workoutDetail, { color: colors.textSecondary }]}>
                  Intensity: {workout.intensity}/10
                </Text>
              </View>
              {workout.notes && (
                <Text style={[styles.workoutNotes, { color: colors.textTertiary }]} numberOfLines={2}>
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  appLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E63946',
    overflow: 'hidden',
  },
  appLogoImage: {
    width: '100%',
    height: '100%',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E63946',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 12,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    color: '#1A1A1A',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E63946',
  },
  logoText: {
    fontSize: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  workoutCard: {
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
  },
  workoutDate: {
    fontSize: 12,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetail: {
    fontSize: 14,
  },
  workoutDivider: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  workoutNotes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
  cycleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
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
    flex: 1,
  },
  activeBadge: {
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
    fontWeight: '600',
    marginBottom: 4,
  },
  cycleDates: {
    fontSize: 12,
    marginBottom: 8,
  },
  cycleDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 12,
  },
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
  progressText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  goalDeadline: {
    fontSize: 12,
    color: '#999',
  },
  goalProgress: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  completedGoalCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  completedGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedGoalEmoji: {
    fontSize: 20,
  },
  completedGoalType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  completedGoalText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  trainingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2A7DE1',
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  trainingDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  trainingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  trainingTime: {
    fontSize: 14,
  },
  trainingNotif: {
    fontSize: 14,
  },
  trainingDescription: {
    fontSize: 14,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  // Tablet-specific styles
  appLogoContainerTablet: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  appLogoTextTablet: {
    fontSize: 34,
  },
  avatarContainerTablet: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholderTextTablet: {
    fontSize: 22,
  },
  greetingTablet: {
    fontSize: 14,
  },
  nameTablet: {
    fontSize: 24,
  },
  premiumBadgeTablet: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  premiumTextTablet: {
    fontSize: 11,
  },
});
