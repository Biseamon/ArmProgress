// This is the home screen for ArmProgress.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSync } from '@/contexts/SyncContext';
import { Cycle } from '@/lib/supabase';
import { AdBanner } from '@/components/AdBanner';
import { AdMediumRectangle } from '@/components/AdMediumRectangle';
import { Calendar, TrendingUp, Target, Clock, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/lib/useResponsive';
import { useHomeData } from '@/hooks/useHomeData';
import { getExercises } from '@/lib/db/queries/exercises';
import type { Exercise } from '@/lib/supabase';
import { convertWeight } from '@/lib/weightUtils';

// Helper function to validate URL
const isValidHttpUrl = (str: string) => {
  let url;
  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

export default function Home() {
  const { profile, isPremium } = useAuth();
  const { colors } = useTheme();
  const { isSyncing } = useSync();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);

  // Use custom hook with caching - replaces all manual fetching!
  const { data: homeData, isLoading: loading, refetch } = useHomeData(profile?.id);

  // Reset avatar error when profile avatar URL changes and auto-fix .jpg to .png if needed
  useEffect(() => {
    const checkAvatar = async () => {
      setAvatarError(false);
      
      if (profile?.avatar_url) {
        if (__DEV__) {
          console.log('[Home] Profile avatar URL changed to:', profile.avatar_url);
        }
        
        const baseUrl = profile.avatar_url.split('?')[0];
        
        // If URL ends with .jpg but .png exists, the profile will auto-update via profile.tsx
        // Just clear the error here so the new image can load
        if (baseUrl.endsWith('.jpg')) {
          const pngUrl = baseUrl.replace(/\.jpg$/, '.png');
          try {
            const response = await fetch(pngUrl, { method: 'HEAD' });
            if (response.ok && __DEV__) {
              console.log('[Home] PNG version exists, waiting for profile update');
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
    };
    
    checkAvatar();
  }, [profile?.avatar_url]);

  // Hide initial loading screen after first data load or sync completes
  useEffect(() => {
    if (!loading && !isSyncing) {
      // Add a small delay so users can see the transition
      const timer = setTimeout(() => setShowInitialLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isSyncing]);

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

  // Check if this is a brand new user (no data at all)
  const isNewUser = !loading && workouts.length === 0 && cycles.length === 0 && 
                     activeGoals.length === 0 && completedGoals.length === 0;

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

  // Skeleton Card Component
  const SkeletonCard = ({ width = '100%', height = 80 }: { width?: any; height?: number }) => {
    const shimmerAnim = new Animated.Value(0);
    
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          styles.skeletonCard,
          { backgroundColor: colors.surface, width, height, opacity },
        ]}
      />
    );
  };

  // Goal Detail Modal Component
  const GoalDetailModal = () => {
    if (!selectedGoal) return null;

    return (
      <Modal
        visible={goalModalVisible}
        animationType="slide"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Target size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Goal Details</Text>
            </View>
            <TouchableOpacity onPress={() => setGoalModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View style={{ gap: 16 }}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Goal Type</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedGoal.goal_type}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Progress</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedGoal.current_value} / {selectedGoal.target_value}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Completion</Text>
                <Text style={[styles.detailValue, { color: colors.secondary }]}>
                  {Math.round(getProgressPercentage(selectedGoal))}%
                </Text>
              </View>

              {selectedGoal.deadline && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Deadline</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(selectedGoal.deadline).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              )}

              <View style={[styles.progressBarContainer, { backgroundColor: colors.background, marginTop: 20 }]}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${getProgressPercentage(selectedGoal)}%`, backgroundColor: colors.secondary }
                  ]}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 24 }]}
                onPress={() => {
                  setGoalModalVisible(false);
                  router.push('/progress');
                }}
              >
                <Text style={styles.modalButtonText}>View All Goals</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Workout Detail Modal Component
  const WorkoutDetailModal = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loadingExercises, setLoadingExercises] = useState(false);

    // Fetch exercises when workout is selected
    useEffect(() => {
      if (selectedWorkout && workoutModalVisible) {
        setLoadingExercises(true);
        getExercises(selectedWorkout.id)
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
    }, [selectedWorkout, workoutModalVisible]);

    // Helper function to convert exercise weight to user's preferred unit
    const getDisplayWeight = (exercise: Exercise) => {
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

    if (!selectedWorkout) return null;

    console.log('[WorkoutModal] Rendering for workout:', selectedWorkout.id, selectedWorkout.workout_type);

    return (
      <Modal
        visible={workoutModalVisible}
        animationType="slide"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TrendingUp size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Workout Details</Text>
            </View>
            <TouchableOpacity onPress={() => setWorkoutModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <View style={{ gap: 16 }}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    {selectedWorkout.workout_type.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(selectedWorkout.created_at)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedWorkout.duration_minutes} minutes
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Intensity</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedWorkout.intensity} / 10
                  </Text>
                </View>

                {selectedWorkout.notes && (
                  <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Notes</Text>
                    <Text style={[styles.detailValue, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                      {selectedWorkout.notes}
                    </Text>
                  </View>
                )}

                {/* Exercises Section */}
                {loadingExercises ? (
                  <View style={styles.exercisesSection}>
                    <Text style={[styles.exercisesSectionTitle, { color: colors.text }]}>Exercises</Text>
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                  </View>
                ) : exercises.length > 0 ? (
                  <View style={styles.exercisesSection}>
                    <Text style={[styles.exercisesSectionTitle, { color: colors.text }]}>
                      Exercises ({exercises.length})
                    </Text>
                    {exercises.map((exercise, index) => (
                      <View 
                        key={exercise.id} 
                        style={[styles.exerciseCard, { backgroundColor: colors.background }]}
                      >
                        <View style={styles.exerciseHeader}>
                          <Text style={[styles.exerciseName, { color: colors.text }]}>
                            {index + 1}. {exercise.exercise_name}
                          </Text>
                        </View>
                        <View style={styles.exerciseDetails}>
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
                          <Text style={[styles.exerciseNotes, { color: colors.textTertiary }]}>
                            {exercise.notes}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary, marginTop: 24 }]}
                  onPress={() => {
                    setWorkoutModalVisible(false);
                    router.push('/(tabs)/training');
                  }}
                >
                  <Text style={styles.modalButtonText}>View All Workouts</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
      </Modal>
    );
  };

  // Show skeleton loading on initial load
  if (showInitialLoading && loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
              <View style={[styles.avatarContainer, isTablet && styles.avatarContainerTablet]}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.greeting, { color: colors.textTertiary }, isTablet && styles.greetingTablet]}>
                  Welcome back,
                </Text>
                <Text style={[styles.name, { color: colors.text }, isTablet && styles.nameTablet]}>
                  {profile?.full_name || 'Athlete'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isSyncing && (
          <View style={[styles.syncBanner, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.syncText, { color: colors.text }]}>
              Setting up your dashboard...
            </Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          <SkeletonCard width={isTablet ? '30%' : '45%'} height={120} />
          <SkeletonCard width={isTablet ? '30%' : '45%'} height={120} />
          <SkeletonCard width={isTablet ? '30%' : '45%'} height={120} />
          <SkeletonCard width={isTablet ? '30%' : '45%'} height={120} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
          <SkeletonCard height={100} />
          <View style={{ height: 12 }} />
          <SkeletonCard height={100} />
          <View style={{ height: 12 }} />
          <SkeletonCard height={100} />
        </View>
      </ScrollView>
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
              {profile?.avatar_url && !avatarError && isValidHttpUrl(profile.avatar_url) ? (
                <Image
                  source={{ 
                    uri: profile.avatar_url,
                    cache: 'reload' // Force reload to get latest image
                  }}
                  style={styles.avatarImage}
                  key={`home-avatar-${profile.avatar_url}-${profile.id}`}
                  onError={(e) => {
                    if (__DEV__) {
                      console.warn('[Home] Avatar load error:', e.nativeEvent.error);
                      console.warn('[Home] Failed avatar URL:', profile.avatar_url);
                    }
                    // Delay setting error to avoid race conditions during upload
                    setTimeout(() => setAvatarError(true), 500);
                  }}
                  onLoad={() => {
                    if (__DEV__) {
                      console.log('[Home] Avatar loaded successfully');
                    }
                    setAvatarError(false); // Clear any previous errors
                  }}
                  onLoadStart={() => {
                    if (__DEV__) {
                      console.log('[Home] Avatar loading started');
                    }
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

      {/* Show sync indicator if syncing after initial load */}
      {!showInitialLoading && isSyncing && (
        <View style={[styles.syncBanner, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.syncText, { color: colors.text }]}>Syncing your data...</Text>
        </View>
      )}

      {/* Welcome message for brand new users */}
      {isNewUser && (
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Welcome to ArmProgress! 💪
          </Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Start your arm wrestling journey by logging your first workout, setting goals, and tracking your progress.
          </Text>
          <View style={styles.welcomeActions}>
            <TouchableOpacity
              style={[styles.welcomeButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/training')}
            >
              <Text style={styles.welcomeButtonText}>Log Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.welcomeButton, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/(tabs)/progress')}
            >
              <Text style={styles.welcomeButtonText}>Set Goals</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              onPress={() => {
                setSelectedGoal(goal);
                setGoalModalVisible(true);
              }}
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
                {training.notification_enabled ? (
                  <Text style={[styles.trainingNotif, { color: colors.secondary }]}>
                    🔔 {training.notification_minutes_before}m before
                  </Text>
                ) : null}
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
            <TouchableOpacity 
              key={workout.id} 
              style={[styles.workoutCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                setSelectedWorkout(workout);
                setWorkoutModalVisible(true);
              }}
              activeOpacity={0.7}
            >
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
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.bottomSpacing} />

      {/* Modals */}
      <GoalDetailModal />
      <WorkoutDetailModal />
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
    alignItems: 'center',
    marginBottom: 8,
  },
  trainingTime: {
    fontSize: 14,
    marginRight: 16,
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
  skeletonCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  syncText: {
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  welcomeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  welcomeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    gap: 16,
    paddingTop: 16,
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
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exercisesSection: {
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
  exerciseCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseHeader: {
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseDetails: {
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
  exerciseNotes: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
