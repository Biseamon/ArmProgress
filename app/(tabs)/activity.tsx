import { useMemo, useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { runFullDiagnostic, cleanupInvalidIds, forceSyncNow } from '@/lib/utils/debugSync';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Plus,
  Send,
  Flame,
  BicepsFlexed,
  ThumbsUp,
  Shield,
  Search,
  Link2,
  PenSquare,
  X,
  Trash2,
  Camera,
} from 'lucide-react-native';
import {
  useFeed,
  useFriends,
  useFriendInvites,
  useIncomingFriendInvites,
  useGroups,
  useCreateFriendInvite,
  useRespondToFriendRequest,
  useRespondToFriendInvite,
  useCreateGroup,
  useRequestJoinGroup,
  useReactToFeed,
  useCreateFeedPost,
  useGroupMembers,
  useGroupInvites,
  useUpdateGroupMemberStatus,
  useRespondGroupInvite,
  useCreateGroupInvite,
  useProfilesByIds,
  useUpdateGroup,
  useDeleteGroup,
  useDeleteFeedPost,
  useUpdateFeedPost,
  useUnfriend,
  useRemoveGroupMember,
} from '@/lib/react-query-sqlite-complete';
import { triggerSync } from '@/lib/sync/syncEngine';
import { getAllReactionsForFeed } from '@/lib/db/queries/activity';

type FeedType = 'goal' | 'pr' | 'summary';
type Reaction = 'arm' | 'fire' | 'like';

type FeedItem = {
  id: string;
  type: FeedType;
  title: string;
  subtitle: string;
  details?: string;
  groupName?: string;
  createdAt: string;
  reactions: Record<Reaction, number>;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
};

type GroupVisibility = 'public' | 'private';

type Group = {
  id: string;
  name: string;
  visibility: GroupVisibility;
  members?: number;
  description?: string;
  membership_status?: 'active' | 'pending';
};

const TESTFLIGHT_LINK = 'https://testflight.apple.com/join/placeholder';
const APP_STORE_LINK = 'https://apps.apple.com/app/idPLACEHOLDER';
const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.armprogress.app';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups'>('feed');
  const [feedScope, setFeedScope] = useState<'all' | 'friends' | 'groups'>('all');
  const { data: feedData = [] } = useFeed();
  const { data: friendsData = [] } = useFriends();
  const { data: friendInvites = [] } = useFriendInvites();
  const { data: incomingFriendInvites = [] } = useIncomingFriendInvites();
  const { data: groupsData = [] } = useGroups();
  const createInvite = useCreateFriendInvite();
  const respondFriend = useRespondToFriendRequest();
  const respondFriendInvite = useRespondToFriendInvite();
  const createGroup = useCreateGroup();
  const joinGroup = useRequestJoinGroup();
  const reactToFeed = useReactToFeed();
  const createGroupInvite = useCreateGroupInvite();
  const groupInvites = useGroupInvites(profile?.id || null, profile?.email || null);
  const updateMemberStatus = useUpdateGroupMemberStatus();
  const respondGroupInvite = useRespondGroupInvite();
  const createPost = useCreateFeedPost();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const deletePost = useDeleteFeedPost();
  const updatePost = useUpdateFeedPost();
  const unfriend = useUnfriend();
  const removeGroupMember = useRemoveGroupMember();
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const isGroupOwner = selectedGroup?.owner_id === profile?.id;

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteModalEmail, setInviteModalEmail] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupVisibility, setNewGroupVisibility] = useState<GroupVisibility>('public');
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState('');
  const [groupVisibilityDraft, setGroupVisibilityDraft] = useState<GroupVisibility>('public');
  const [uploadingGroupAvatar, setUploadingGroupAvatar] = useState(false);

  useEffect(() => {
    if (selectedGroup) {
      setGroupDescriptionDraft(selectedGroup.description || '');
      setGroupVisibilityDraft(selectedGroup.visibility || 'public');
    }
  }, [selectedGroup]);

  useFocusEffect(
    useMemo(
      () => () => {
        if (profile?.id) {
          triggerSync(profile.id);
        }
      },
      [profile?.id]
    )
  );
  const [showComposer, setShowComposer] = useState(false);
  const [composeType, setComposeType] = useState<FeedType>('summary');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeGroupId, setComposeGroupId] = useState<string | null>(null);
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [editingPost, setEditingPost] = useState<{ id: string; title: string; body: string } | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Map<string, { arm: number; fire: number; like: number }>>(new Map());

  const refreshReactions = useCallback(async () => {
    const reactions = await getAllReactionsForFeed();
    const counts = new Map<string, { arm: number; fire: number; like: number }>();

    // Initialize all posts with 0 counts
    feedData.forEach((post: any) => {
      counts.set(post.id, { arm: 0, fire: 0, like: 0 });
    });

    // Aggregate reaction counts by post and type
    reactions.forEach((r: any) => {
      const current = counts.get(r.post_id) || { arm: 0, fire: 0, like: 0 };
      current[r.reaction as Reaction] = Number(r.count) || 0;
      counts.set(r.post_id, current);
    });

    setReactionCounts(counts);
  }, [feedData]);

  // Fetch reaction counts when feed data changes or after a toggle
  useEffect(() => {
    refreshReactions();
  }, [refreshReactions]);

  const membersQuery = useGroupMembers(selectedGroup?.id || null);
  const profileIds = Array.from(new Set(
    feedData.map((f: any) => f.user_id)
      .concat(membersQuery.data?.map((m:any)=>m.user_id)||[])
      .concat(friendsData.flatMap((f:any)=>[f.user_id, f.friend_user_id])||[])
      .concat(incomingFriendInvites.map((invite:any)=>invite.inviter_id)||[])
  ));
  const profilesQuery = useProfilesByIds(profileIds.filter(Boolean));
  const profileMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string; avatar_url?: string }>();
    profilesQuery.data?.forEach((p: any) => {
      map.set(p.id, { name: p.full_name || p.email || 'User', email: p.email, avatar_url: p.avatar_url });
    });
    return map;
  }, [profilesQuery.data]);

  const filteredGroups = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();
    if (!term) return groupsData;
    return groupsData.filter((g: any) => {
      const matchesSearch = (g.name || '').toLowerCase().includes(term);
      // Private groups only visible if user is already a member
      if (g.visibility === 'private') {
        return matchesSearch && g.membership_status === 'active';
      }
      // Public groups always searchable
      return matchesSearch;
    });
  }, [groupSearch, groupsData]);

  const handleShareInvite = async () => {
    const iosLink = __DEV__ ? TESTFLIGHT_LINK : APP_STORE_LINK;
    const link = Platform.OS === 'android' ? PLAY_STORE_LINK : iosLink;
    const message = `Join me on ArmProgress to track armwrestling gains. Download here: ${link}`;
    try {
      await Share.share({ message });
    } catch (error) {
      console.warn('Share failed', error);
    }
  };

  const handleAddInvite = () => {
    if (!inviteEmail.trim() || createInvite.isPending) return;
    createInvite.mutate({ email: inviteEmail.trim() });
    setInviteEmail('');
  };

  const toggleReaction = (id: string, reaction: Reaction) => {
    reactToFeed.mutate(
      { postId: id, reaction },
      {
        onSuccess: refreshReactions,
      }
    );
  };

  const handleSharePost = () => {
    if (!composeTitle.trim() || createPost.isPending) {
      if (!composeTitle.trim()) setShowComposer(false);
      return;
    }
    createPost.mutate(
      {
        type: composeType,
        title: composeTitle.trim(),
        body: composeBody.trim() || undefined,
        groupId: composeGroupId || undefined,
      },
      {
        onSuccess: () => {
          setShowComposer(false);
          setComposeTitle('');
          setComposeBody('');
          setComposeGroupId(null);
          setComposeType('summary');
        },
      }
    );
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || createGroup.isPending) return;
    createGroup.mutate({ name: newGroupName.trim(), description: '', visibility: newGroupVisibility });
    setNewGroupName('');
    setNewGroupVisibility('public');
  };

  const handleJoinGroup = (groupId: string, isPublic: boolean) => {
    if (joinGroup.isPending) return;
    joinGroup.mutate({ groupId, status: isPublic ? 'active' : 'pending' });
  };

  // Debug tools for sync cleanup
  const handleRunDiagnostic = async () => {
    if (!profile?.id) return;
    const report = await runFullDiagnostic(profile.id);
    Alert.alert(
      'Sync Diagnostic',
      `Invalid IDs: ${report.invalidIds.totalInvalid}\nPending Sync: ${report.pendingSync.totalPending}\n\n${report.recommendations.join('\n')}`,
      [{ text: 'OK' }]
    );
  };

  const handleCleanup = async () => {
    Alert.alert(
      'Clean Invalid IDs',
      'This will permanently delete local records with invalid UUIDs that cannot sync to Supabase. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean',
          style: 'destructive',
          onPress: async () => {
            const result = await cleanupInvalidIds();
            Alert.alert('Cleanup Complete', `Removed ${result.totalCleaned} invalid records`);
            if (profile?.id) {
              await forceSyncNow(profile.id);
            }
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    if (!profile?.id) return;
    Alert.alert('Force Sync', 'Starting manual sync...', [{ text: 'OK' }]);
    const result = await forceSyncNow(profile.id);
    if (result.success) {
      Alert.alert('Sync Complete', 'All pending records have been synced to Supabase');
    } else {
      Alert.alert('Sync Failed', `Error: ${result.error}`);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePost.mutate({ postId }),
        },
      ]
    );
  };

  const handleEditPost = (post: { id: string; title: string; body: string }) => {
    setEditingPost(post);
  };

  const handleSaveEditPost = () => {
    if (!editingPost || !editingPost.title.trim() || updatePost.isPending) return;
    updatePost.mutate(
      {
        postId: editingPost.id,
        title: editingPost.title.trim(),
        body: editingPost.body.trim() || undefined,
      },
      {
        onSuccess: () => {
          setEditingPost(null);
        },
      }
    );
  };

  const handleUnfriend = (friend: any) => {
    const friendUserId = otherId(friend);
    const friendName = profileMap.get(friendUserId)?.name || friendUserId;
    Alert.alert(
      'Unfriend',
      `Remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: () => unfriend.mutate({ friendId: friend.id, friendUserId }),
        },
      ]
    );
  };

  const handleRemoveMember = (member: any) => {
    if (!selectedGroup) return;
    const memberName = profileMap.get(member.user_id)?.name || member.user_id;
    Alert.alert(
      'Remove member',
      `Remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeGroupMember.mutate({ memberId: member.id, groupId: selectedGroup.id }),
        },
      ]
    );
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"? This will remove all members and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGroup.mutate({ groupId });
            setSelectedGroup(null);
          },
        },
      ]
    );
  };

  const pickGroupImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0] && selectedGroup) {
        await uploadGroupAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadGroupAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingGroupAvatar(true);

      if (!selectedGroup || !profile) {
        Alert.alert('Error', 'No group selected');
        return;
      }

      // Ensure group exists in Supabase (RLS policy checks groups table)
      const { data: groupExists, error: checkError } = await supabase
        .from('groups')
        .select('id')
        .eq('id', selectedGroup.id)
        .single();

      if (checkError || !groupExists) {
        Alert.alert(
          'Sync Required',
          'Please wait for the group to sync before uploading an avatar. Try force syncing first.'
        );
        return;
      }

      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          'File Too Large',
          `Image must be under 5MB. Your file is ${(asset.fileSize / 1024 / 1024).toFixed(2)}MB`
        );
        return;
      }

      // Get file extension
      let fileExt = 'jpg';
      if (asset.mimeType) {
        const mimeExt = asset.mimeType.split('/')[1]?.toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (mimeExt && validExtensions.includes(mimeExt)) {
          fileExt = (mimeExt === 'jpeg' || mimeExt === 'jpg') ? 'jpg' : mimeExt;
        }
      }

      // Delete ALL old avatars for this group (to handle different file extensions)
      try {
        // List all files in the group-avatars bucket for this group
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('group-avatars')
          .list(selectedGroup.id); // List files in the group's folder

        if (listError) {
          console.warn('Failed to list existing group avatars:', listError);
        } else if (existingFiles && existingFiles.length > 0) {
          // Build full paths for deletion (group-id/filename)
          const filesToDelete = existingFiles.map(file => `${selectedGroup.id}/${file.name}`);
          console.log('Deleting old group avatars:', filesToDelete);

          const { error: deleteError } = await supabase.storage
            .from('group-avatars')
            .remove(filesToDelete);

          if (deleteError) {
            console.warn('Failed to delete old group avatars:', deleteError);
          } else {
            console.log('Old group avatars deleted successfully');
          }
        }
      } catch (error) {
        console.warn('Error deleting old group avatars:', error);
        // Don't throw - continue with upload even if deletion fails
      }

      // Read file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage with folder structure
      const filePath = `${selectedGroup.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('group-avatars')
        .upload(filePath, arrayBuffer, {
          contentType: asset.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting timestamp
      const { data: { publicUrl } } = supabase.storage
        .from('group-avatars')
        .getPublicUrl(filePath);

      if (__DEV__) {
        console.log('Generated public URL:', publicUrl);
      }

      // Validate the URL
      if (!publicUrl || !publicUrl.startsWith('http')) {
        throw new Error('Invalid storage URL generated. Please check Supabase configuration.');
      }

      // Add cache-busting timestamp to the URL stored in database
      const timestamp = Date.now();
      const publicUrlWithTimestamp = `${publicUrl}?t=${timestamp}`;

      if (__DEV__) {
        console.log('Updating group with URL:', publicUrlWithTimestamp);
      }

      // Update group in SQLite first
      await updateGroup.mutateAsync({
        groupId: selectedGroup.id,
        description: selectedGroup.description,
        visibility: selectedGroup.visibility,
        avatarUrl: publicUrlWithTimestamp,
      });

      // CRITICAL: Update Supabase directly so changes are immediately visible
      if (__DEV__) {
        console.log('[Activity] Updating Supabase directly with group avatar URL...');
      }
      const { error: supabaseError } = await supabase
        .from('groups')
        .update({ avatar_url: publicUrlWithTimestamp })
        .eq('id', selectedGroup.id);

      if (supabaseError) {
        console.error('[Activity] Supabase update error:', supabaseError);
        throw supabaseError;
      }
      if (__DEV__) {
        console.log('[Activity] Supabase updated successfully with group avatar URL');
      }

      // Update local state immediately
      setSelectedGroup({ ...selectedGroup, avatar_url: publicUrlWithTimestamp });

      Alert.alert('Success', 'Group avatar updated!');
    } catch (error) {
      console.error('Error uploading group avatar:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingGroupAvatar(false);
    }
  };

  const renderTabSwitcher = () => (
    <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {[
        { key: 'feed', label: 'Activity', badge: 0 },
        { key: 'friends', label: 'Friends', badge: pendingFriendCount },
        { key: 'groups', label: 'Groups', badge: pendingGroupCount },
      ].map(({ key, label, badge }) => {
        const active = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.tabButton,
              { backgroundColor: active ? colors.primary : 'transparent', borderColor: colors.border },
            ]}
            onPress={() => setActiveTab(key as any)}
          >
            <Text style={[styles.tabButtonText, { color: active ? '#FFF' : colors.text }]}>
              {label}
            </Text>
            {badge > 0 && (
              <View style={[styles.badge, { backgroundColor: active ? '#FFF' : colors.primary }]}>
                <Text style={[styles.badgeText, { color: active ? colors.primary : '#FFF' }]}>
                  {badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    groupsData.forEach((g: any) => {
      if (g?.id && g?.name) map.set(g.id, g.name);
    });
    return map;
  }, [groupsData]);

  const feedItems: FeedItem[] = useMemo(() => {
    return feedData.map((item: any) => ({
      id: item.id,
      type: item.type as FeedType,
      title: item.title,
      subtitle: item.body || '',
      details: item.metadata?.details || '',
      groupName: item.group_id ? groupNameMap.get(item.group_id) : undefined,
      createdAt: item.created_at || '',
      reactions: reactionCounts.get(item.id) || { arm: 0, fire: 0, like: 0 },
      user: {
        id: item.user_id,
        name: profileMap.get(item.user_id)?.name || item.user_id?.slice(0, 6) || 'User',
        avatar_url: profileMap.get(item.user_id)?.avatar_url,
      },
    }));
  }, [feedData, groupNameMap, profileMap, reactionCounts]);

  const filteredFeed = useMemo(() => {
    if (feedScope === 'all') return feedItems;
    if (feedScope === 'friends') {
      return feedItems.filter((item) => item.user.id !== profile?.id);
    }
    if (feedScope === 'groups') {
      return feedItems.filter((item) => !!item.groupName);
    }
    return feedItems;
  }, [feedScope, feedItems, profile?.id]);

  const renderFeed = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary, marginBottom: 12 }]}
        onPress={() => setShowComposer(true)}
      >
        <PenSquare size={18} color="#FFF" />
        <Text style={styles.primaryButtonText}>Share update</Text>
      </TouchableOpacity>

      <View style={styles.filterRow}>
        {(['all', 'friends', 'groups'] as const).map((scope) => {
          const active = feedScope === scope;
          return (
            <TouchableOpacity
              key={scope}
              style={[
                styles.chip,
                {
                  borderColor: colors.border,
                  backgroundColor: active ? colors.primary : 'transparent',
                  paddingVertical: 6,
                },
              ]}
              onPress={() => setFeedScope(scope)}
            >
              <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>
                {scope === 'all' ? 'All' : scope === 'friends' ? 'Friends' : 'Groups'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredFeed.map((item) => (
        <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            {item.user.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.feedUserAvatar} />
            ) : (
              <View style={styles.feedUserAvatarPlaceholder}>
                <Users size={20} color={colors.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                by {item.user.name} {item.groupName ? `in ${item.groupName} • ` : '• '}
                {item.subtitle || item.createdAt}
              </Text>
            </View>
            {item.user.id === profile?.id && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleEditPost({ id: item.id, title: item.title, body: item.subtitle })}
                  style={{ padding: 6 }}
                >
                  <PenSquare size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={{ padding: 6 }}>
                  <Trash2 size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {item.details ? (
            <Text style={[styles.cardDetails, { color: colors.textSecondary }]}>{item.details}</Text>
          ) : null}
          <View style={styles.reactionsRow}>
            <TouchableOpacity
              style={[styles.reactionButton, item.user.id === profile?.id && { opacity: 0.5 }]}
              onPress={() => toggleReaction(item.id, 'arm')}
              disabled={item.user.id === profile?.id}
            >
              <BicepsFlexed size={22} color={colors.primary} />
              <Text style={[styles.reactionText, { color: colors.text }]}>{item.reactions.arm}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reactionButton, item.user.id === profile?.id && { opacity: 0.5 }]}
              onPress={() => toggleReaction(item.id, 'fire')}
              disabled={item.user.id === profile?.id}
            >
              <Flame size={22} color="#F97316" />
              <Text style={[styles.reactionText, { color: colors.text }]}>{item.reactions.fire}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reactionButton, item.user.id === profile?.id && { opacity: 0.5 }]}
              onPress={() => toggleReaction(item.id, 'like')}
              disabled={item.user.id === profile?.id}
            >
              <ThumbsUp size={22} color={colors.secondary} />
              <Text style={[styles.reactionText, { color: colors.text }]}>{item.reactions.like}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={[styles.tag, { color: colors.secondary }]}>
              {item.type === 'goal' ? 'Goal' : item.type === 'pr' ? 'PR' : 'Summary'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const otherId = (f: any) => (f.user_id === profile?.id ? f.friend_user_id : f.user_id);

  const outgoingPending = friendsData.filter((f: any) => f.status === 'pending' && f.direction === 'outgoing');
  const incomingPending = friendsData.filter((f: any) => f.status === 'pending' && f.direction === 'incoming');
  const acceptedFriends = friendsData.filter((f: any) => f.status === 'accepted');
  const uniqueAccepted = Array.from(
    acceptedFriends.reduce((map: Map<string,any>, f:any) => {
      const id = otherId(f);
      if (!map.has(id)) map.set(id, f);
      return map;
    }, new Map())
  ).map(([, friend]) => friend);
  const pendingFriendCount = (incomingFriendInvites?.length || 0) + (incomingPending?.length || 0);
  const pendingGroupCount =
    (groupInvites.data?.length || 0) +
    groupsData.filter((g: any) => g.membership_status === 'pending').length;

  const renderFriends = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Friends</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Share the download link or add by email. Requests require acceptance; new signups with a matching invite auto-accept.
        </Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleShareInvite}>
          <Link2 size={18} color="#FFF" />
          <Text style={styles.primaryButtonText}>Share invite link</Text>
        </TouchableOpacity>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Invite by email</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="friend@email.com"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity onPress={handleAddInvite} style={styles.iconButton}>
              <Send size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {friendInvites.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Pending invites (outgoing)</Text>
            {friendInvites.map((invite: any) => (
              <View key={invite.id} style={styles.pendingRow}>
                <Users size={16} color={colors.textSecondary} />
                <Text style={{ color: colors.text }}>{invite.invitee_email}</Text>
                <Text style={{ color: colors.textTertiary, marginLeft: 'auto' }}>Sent</Text>
              </View>
            ))}
          </View>
        )}

        {incomingFriendInvites.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Invites for you</Text>
            {incomingFriendInvites.map((invite: any) => {
              const inviterAvatar = profileMap.get(invite.inviter_id)?.avatar_url;
              return (
                <View key={invite.id} style={styles.pendingRow}>
                  {inviterAvatar ? (
                    <Image source={{ uri: inviterAvatar }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Users size={16} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={{ color: colors.text }}>
                    {profileMap.get(invite.inviter_id)?.name || profileMap.get(invite.inviter_id)?.email || 'Unknown User'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { borderColor: colors.primary }]}
                      onPress={() => respondFriendInvite.mutate({ invite, accept: true })}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={() => respondFriendInvite.mutate({ invite, accept: false })}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {incomingPending.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Incoming requests</Text>
            {incomingPending.map((req: any) => {
              const requesterId = otherId(req);
              const requesterAvatar = profileMap.get(requesterId)?.avatar_url;
              return (
                <View key={req.id} style={styles.pendingRow}>
                  {requesterAvatar ? (
                    <Image source={{ uri: requesterAvatar }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Users size={16} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={{ color: colors.text }}>{profileMap.get(requesterId)?.name || requesterId}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { borderColor: colors.primary }]}
                      onPress={() => respondFriend.mutate({ id: req.id, requesterId: req.user_id, accept: true })}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { borderColor: colors.border }]}
                      onPress={() => respondFriend.mutate({ id: req.id, requesterId: req.user_id, accept: false })}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {uniqueAccepted.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Friends</Text>
            {uniqueAccepted.map((friend: any) => {
              const friendUserId = otherId(friend);
              const friendName = profileMap.get(friendUserId)?.name || friendUserId;
              const friendAvatar = profileMap.get(friendUserId)?.avatar_url;
              return (
                <View key={friend.id} style={styles.pendingRow}>
                  {friendAvatar ? (
                    <Image source={{ uri: friendAvatar }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Users size={16} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={{ color: colors.text, flex: 1 }}>{friendName}</Text>
                  <TouchableOpacity onPress={() => handleUnfriend(friend)} style={{ padding: 4 }}>
                    <Trash2 size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderGroups = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Create a group</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Group name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="e.g., East Coast Pullers"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {(['public', 'private'] as GroupVisibility[]).map((v) => {
              const active = newGroupVisibility === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.chip,
                    { borderColor: colors.border, backgroundColor: active ? colors.primary : 'transparent' },
                  ]}
                  onPress={() => setNewGroupVisibility(v)}
                >
                  {v === 'private' ? <Shield size={16} color={active ? '#FFF' : colors.textSecondary} /> : <Users size={16} color={active ? '#FFF' : colors.textSecondary} />}
                  <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{v === 'public' ? 'Public' : 'Private'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleCreateGroup}>
          <Plus size={18} color="#FFF" />
          <Text style={styles.primaryButtonText}>Create group</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.searchRow}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={groupSearch}
            onChangeText={setGroupSearch}
            placeholder="Search groups"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={{ marginTop: 12 }}>
          {filteredGroups.map((group: any) => {
            const membership = group.membership_status;
            const isMember = membership === 'active';
            const isPending = membership === 'pending';
            const memberCount = group.members ?? '—';
            return (
            <TouchableOpacity
              key={group.id}
              style={[styles.groupRow, { borderColor: colors.border }]}
              onPress={() => setSelectedGroup(group)}
            >
              {group.avatar_url ? (
                <Image source={{ uri: group.avatar_url }} style={styles.groupAvatar} />
              ) : (
                <View style={styles.groupAvatarPlaceholder}>
                  <Users size={24} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                  {group.visibility === 'private' ? 'Private' : 'Public'} • {memberCount} members
                </Text>
                {group.description ? (
                  <Text style={[styles.groupDescription, { color: colors.textTertiary }]}>{group.description}</Text>
                ) : null}
              </View>
              {isMember ? (
                <View style={[styles.memberBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Member</Text>
                </View>
              ) : isPending ? (
                <View style={[styles.memberBadge, { backgroundColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary }}>Pending</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={() => handleJoinGroup(group.id, group.visibility === 'public')}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                    {group.visibility === 'public' ? 'Join' : 'Request to join'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )})}
          {filteredGroups.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No groups found.</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Activity</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Feed • Friends • Groups</Text>
          </View>
          <TouchableOpacity onPress={() => setShowDebugTools(!showDebugTools)} style={{ padding: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 20 }}>🔧</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDebugTools && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: 16, marginBottom: 12 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🔧 Debug Tools</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>
            Use these tools to fix sync issues after applying the migration
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary, marginBottom: 8 }]}
            onPress={handleRunDiagnostic}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Run Diagnostic</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: '#d00', marginBottom: 8 }]}
            onPress={handleCleanup}
          >
            <Text style={[styles.secondaryButtonText, { color: '#d00' }]}>Clean Invalid IDs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleForceSync}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Force Sync Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderTabSwitcher()}

      <View style={styles.content}>
        {activeTab === 'feed' && renderFeed()}
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'groups' && renderGroups()}
      </View>

      <Modal visible={!!selectedGroup} animationType="slide" transparent onRequestClose={() => setSelectedGroup(null)}>
        {selectedGroup ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalOverlayBottom}>
              <View style={[styles.bottomSheetFull, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                    {selectedGroup.name || 'Group'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                    <X size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                      {selectedGroup.avatar_url ? (
                        <Image source={{ uri: selectedGroup.avatar_url }} style={styles.groupAvatar} />
                      ) : (
                        <View style={styles.groupAvatarPlaceholder}>
                          <Users size={24} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.groupName, { color: colors.text }]}>{selectedGroup.name || 'Group'}</Text>
                        <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                          {selectedGroup.visibility === 'private' ? 'Private' : 'Public'} • {selectedGroup.members ?? '—'} members
                        </Text>
                      </View>
                    </View>
                    {selectedGroup.description ? (
                      <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>{selectedGroup.description}</Text>
                    ) : null}
                  </View>
                  {isGroupOwner ? (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage group</Text>
                      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Update group avatar, description, or visibility.</Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <TouchableOpacity onPress={pickGroupImage} disabled={uploadingGroupAvatar}>
                          {selectedGroup.avatar_url ? (
                            <Image source={{ uri: selectedGroup.avatar_url }} style={styles.groupAvatar} />
                          ) : (
                            <View style={styles.groupAvatarPlaceholder}>
                              <Users size={24} color={colors.textSecondary} />
                            </View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { borderColor: colors.primary, opacity: uploadingGroupAvatar ? 0.6 : 1 }]}
                          onPress={pickGroupImage}
                          disabled={uploadingGroupAvatar}
                        >
                          <Camera size={16} color={colors.primary} />
                          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                            {uploadingGroupAvatar ? 'Uploading...' : 'Change Avatar'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={groupDescriptionDraft}
                          onChangeText={setGroupDescriptionDraft}
                          placeholder="Group description"
                          placeholderTextColor={colors.textTertiary}
                        />
                      </View>
                      <View style={[styles.visibilityRow, { marginTop: 8 }]}>
                        {(['public', 'private'] as GroupVisibility[]).map((v) => {
                          const active = groupVisibilityDraft === v;
                          return (
                            <TouchableOpacity
                              key={v}
                              style={[
                                styles.chip,
                                { borderColor: colors.border, backgroundColor: active ? colors.primary : 'transparent' },
                              ]}
                              onPress={() => setGroupVisibilityDraft(v)}
                            >
                              {v === 'private' ? <Shield size={16} color={active ? '#FFF' : colors.textSecondary} /> : <Users size={16} color={active ? '#FFF' : colors.textSecondary} />}
                              <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{v === 'public' ? 'Public' : 'Private'}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 12, opacity: updateGroup.isPending ? 0.6 : 1 }]}
                        onPress={() => {
                          updateGroup.mutate({ groupId: selectedGroup.id, description: groupDescriptionDraft, visibility: groupVisibilityDraft });
                        }}
                        disabled={updateGroup.isPending}
                      >
                        <Text style={styles.primaryButtonText}>Save changes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: '#d00', marginTop: 10 }]}
                        onPress={() => handleDeleteGroup(selectedGroup.id, selectedGroup.name)}
                      >
                        <Text style={[styles.secondaryButtonText, { color: '#d00' }]}>Delete group</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership</Text>
                    <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                      {selectedGroup.membership_status === 'active'
                        ? 'You are a member of this group.'
                        : selectedGroup.membership_status === 'pending'
                        ? 'Join request pending approval.'
                        : 'You are not a member.'}
                    </Text>
                    {selectedGroup.membership_status === 'active' || selectedGroup.membership_status === 'pending' ? null : (
                      <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: joinGroup.isPending ? 0.6 : 1 }]}
                        onPress={() => {
                          joinGroup.mutate({
                            groupId: selectedGroup.id,
                            status: selectedGroup.visibility === 'public' ? 'active' : 'pending',
                          });
                        }}
                        disabled={joinGroup.isPending}
                      >
                        <Users size={18} color="#FFF" />
                        <Text style={styles.primaryButtonText}>
                          {selectedGroup.visibility === 'public' ? 'Join' : 'Request to join'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Members</Text>
                    {membersQuery.data && membersQuery.data.length > 0 ? (
                      membersQuery.data.map((m: any) => {
                        const pending = m.status === 'pending';
                        const isOwner = m.user_id === selectedGroup?.owner_id;
                        const canRemove = isGroupOwner && !isOwner && m.user_id !== profile?.id;
                        const displayName = profileMap.get(m.user_id)?.name || m.user_id;
                        const avatarUrl = profileMap.get(m.user_id)?.avatar_url;
                        return (
                          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                            {avatarUrl ? (
                              <Image source={{ uri: avatarUrl }} style={styles.memberAvatar} />
                            ) : (
                              <View style={styles.memberAvatarPlaceholder}>
                                <Users size={16} color={colors.textSecondary} />
                              </View>
                            )}
                            <Text style={{ color: colors.text, flex: 1 }}>{displayName}</Text>
                            {isOwner ? (
                              <View style={styles.ownerBadge}>
                                <Text style={styles.ownerBadgeText}>Owner</Text>
                              </View>
                            ) : (
                              <Text style={{ color: pending ? colors.warning : colors.textTertiary, marginRight: 8 }}>
                                {m.status}
                              </Text>
                            )}
                            {isGroupOwner && pending ? (
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TouchableOpacity
                                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                                  onPress={() => updateMemberStatus.mutate({ id: m.id, status: 'active' })}
                                >
                                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                                  onPress={() => updateMemberStatus.mutate({ id: m.id, status: 'rejected' })}
                                >
                                  <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Decline</Text>
                                </TouchableOpacity>
                              </View>
                            ) : null}
                            {canRemove ? (
                              <TouchableOpacity onPress={() => handleRemoveMember(m)} style={{ padding: 4 }}>
                                <Trash2 size={16} color={colors.textSecondary} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        );
                      })
                    ) : (
                      <Text style={{ color: colors.textSecondary }}>No members yet.</Text>
                    )}
                  </View>
                  {groupInvites.data && groupInvites.data.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Invites</Text>
                  {groupInvites.data.map((inv: any) => (
                    <View key={inv.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                      <Users size={16} color={colors.textSecondary} />
                      <Text style={{ color: colors.text }}>{inv.group_id}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { borderColor: colors.primary }]}
                          onPress={() => respondGroupInvite.mutate({ invite: inv, accept: true })}
                        >
                          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryButton, { borderColor: colors.border }]}
                          onPress={() => respondGroupInvite.mutate({ invite: inv, accept: false })}
                        >
                          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                      ))}
                    </View>
                  )}
                  {isGroupOwner && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite</Text>
                      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={inviteModalEmail}
                          onChangeText={setInviteModalEmail}
                          placeholder="friend@email.com"
                          placeholderTextColor={colors.textTertiary}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TouchableOpacity
                          style={[styles.iconButton, { opacity: createGroupInvite.isPending ? 0.6 : 1 }]}
                          onPress={() => {
                            if (!inviteModalEmail.trim()) return;
                            createGroupInvite.mutate({ groupId: selectedGroup.id, email: inviteModalEmail.trim() });
                            setInviteModalEmail('');
                          }}
                          disabled={createGroupInvite.isPending}
                        >
                          <Send size={18} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={{ color: colors.textTertiary, marginTop: 6 }}>
                        Owners can invite by email. Invites remain pending until accepted.
                      </Text>
                    </View>
                  )}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Visibility</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      {selectedGroup.visibility === 'private' ? (
                        <Shield size={18} color={colors.textSecondary} />
                      ) : (
                        <Users size={18} color={colors.textSecondary} />
                      )}
                      <Text style={{ color: colors.textSecondary }}>
                        {selectedGroup.visibility === 'private' ? 'Private - members only' : 'Public - searchable'}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </Modal>
      <Modal visible={showComposer} animationType="slide" transparent onRequestClose={() => setShowComposer(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlayBottom}>
            <View style={[styles.bottomSheetFull, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Share to Activity</Text>
                <TouchableOpacity onPress={() => setShowComposer(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={{ padding: 20 }}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                    <View style={styles.visibilityRow}>
                      {(['goal', 'pr', 'summary'] as FeedType[]).map((t) => {
                        const active = composeType === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            style={[
                              styles.chip,
                              { borderColor: colors.border, backgroundColor: active ? colors.primary : 'transparent' },
                            ]}
                            onPress={() => setComposeType(t)}
                          >
                            <Text style={[styles.chipText, { color: active ? '#FFF' : colors.text }]}>{t.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1, padding: 12 }]}
                      value={composeTitle}
                      onChangeText={setComposeTitle}
                      placeholder="e.g., New PR: Wrist curl 85kg"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Details (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, borderWidth: 1, padding: 12 }]}
                      value={composeBody}
                      onChangeText={setComposeBody}
                      multiline
                      numberOfLines={3}
                      placeholder="Add context or notes..."
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Share to group (optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      <TouchableOpacity
                        style={[
                          styles.chip,
                          { borderColor: colors.border, backgroundColor: composeGroupId === null ? colors.primary : 'transparent', marginRight: 8 },
                        ]}
                        onPress={() => setComposeGroupId(null)}
                      >
                        <Text style={[styles.chipText, { color: composeGroupId === null ? '#FFF' : colors.text }]}>None</Text>
                      </TouchableOpacity>
                      {groupsData.map((g: any) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.chip,
                            { borderColor: colors.border, backgroundColor: composeGroupId === g.id ? colors.primary : 'transparent', marginRight: 8 },
                          ]}
                          onPress={() => setComposeGroupId(g.id)}
                        >
                          <Text style={[styles.chipText, { color: composeGroupId === g.id ? '#FFF' : colors.text }]}>{g.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>

              <View style={{ padding: 20, paddingBottom: 40 }}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: createPost.isPending ? 0.6 : 1 }]}
                  onPress={handleSharePost}
                  disabled={createPost.isPending}
                >
                  <Text style={styles.primaryButtonText}>{createPost.isPending ? 'Sharing...' : 'Share'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Post Modal */}
      <Modal visible={!!editingPost} animationType="slide" transparent onRequestClose={() => setEditingPost(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlayBottom}>
            <View style={[styles.bottomSheetFull, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Post</Text>
                <TouchableOpacity onPress={() => setEditingPost(null)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={{ padding: 20 }}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Title</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, padding: 12 }]}
                      value={editingPost?.title || ''}
                      onChangeText={(text) => setEditingPost(editingPost ? { ...editingPost, title: text } : null)}
                      placeholder="Post title"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Body (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, padding: 12 }]}
                      value={editingPost?.body || ''}
                      onChangeText={(text) => setEditingPost(editingPost ? { ...editingPost, body: text } : null)}
                      multiline
                      numberOfLines={3}
                      placeholder="Post details..."
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={{ padding: 20, paddingBottom: 40 }}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: updatePost.isPending ? 0.6 : 1 }]}
                  onPress={handleSaveEditPost}
                  disabled={updatePost.isPending}
                >
                  <Text style={styles.primaryButtonText}>{updatePost.isPending ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderWidth: 1,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  content: { flex: 1, paddingHorizontal: 12 },
  scroll: { flex: 1, paddingTop: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  cardSubtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  cardDetails: {
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
  },
  tag: {
    fontSize: 13,
    fontWeight: '700',
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reactionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: { marginTop: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  iconButton: { padding: 6 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  groupRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  groupDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  secondaryButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  visibilityRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  chipText: { fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  modalCardLarge: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 16,
  },
  bottomSheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  bottomSheetFull: {
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ownerBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  memberAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  feedUserAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  groupAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});
