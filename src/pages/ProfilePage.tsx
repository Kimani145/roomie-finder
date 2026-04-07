import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/firebase/profiles';
import type { UserProfile } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import {
  MapPin,
  BookOpen,
  Wallet,
  Moon,
  Sparkles,
  LogOut,
  Edit,
  Music,
  Ban,
  PersonStanding,
  Camera,
  Loader2,
} from 'lucide-react';
import { db } from '@/firebase/config';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentUser, setCurrentUser } = useAuthStore();
  const Maps = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(currentUser);
  const [loading, setLoading] = useState(!currentUser);
  const [isUploading, setIsUploading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'active' | 'paused'>(
    currentUser?.status === 'paused' ? 'paused' : 'active'
  );
  const DEFAULT_AVATAR =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23e2e8f0"/><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-size="52" fill="%23475569">?</text></svg>';

  // Fetch from Firestore if authStore doesn't have the profile yet
  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
      setLoading(false);
      return;
    }
    if (!user) return;

    let cancelled = false;
    (async () => {
      try {
        const fetched = await getUserProfile(user.uid);
        if (!cancelled) setProfile(fetched);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, currentUser]);

  useEffect(() => {
    if (!profile) return;
    setProfileStatus(profile.status === 'paused' ? 'paused' : 'active');
  }, [profile]);

  const isPaused = profileStatus === 'paused';
  const toggleStatus = async () => {
    if (!currentUser) return;
    const newStatus = profileStatus === 'active' ? 'paused' : 'active';
    setProfileStatus(newStatus); // Optimistic UI update

    try {
      const promise = updateDoc(doc(db, 'profiles', currentUser.uid), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      toast.promise(promise, {
        loading: 'Updating profile status...',
        success: `Profile ${newStatus === 'paused' ? 'paused' : 'active'}!`,
        error: 'Failed to update profile status.'
      });

      await promise;
      
      // Update local state to match
      const nextUser = { ...currentUser, status: newStatus } as any;
      setCurrentUser(nextUser);
      if (profile) setProfile({ ...profile, status: newStatus });
      
    } catch (error) {
      console.error('Failed to update profile status:', error);
      // Revert optimistic update on error
      setProfileStatus(profileStatus);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'profiles', currentUser.uid), { photoURL: url });
      await updateDoc(doc(db, 'users', currentUser.uid), { updatedAt: new Date() });
      const nextUser = { ...currentUser, photoURL: url };
      setCurrentUser(nextUser);
      setProfile(nextUser);
      toast.success('Profile photo updated.');
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      toast.error('Could not upload profile photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No profile found.
        </p>
      </div>
    );
  }

  const isHost = (currentUser?.role ?? profile.role) === 'HOST';

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto w-full py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (Identity) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden p-4 lg:p-6 lg:sticky top-8 space-y-3">
            <div className="flex flex-col items-center text-center">
              <label className="relative inline-block group cursor-pointer mb-4">
                <img
                  src={currentUser?.photoURL || profile.photoURL || DEFAULT_AVATAR}
                  alt="Profile"
                  className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-sm ${isUploading ? 'opacity-50' : ''}`}
                />
                <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {profile.displayName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mode: {currentUser?.role ?? profile.role}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {profile.gender} · {profile.age} yrs · Year {profile.courseYear}
              </p>
              {profile.bioQuote && (
                <p className="text-lg font-serif italic text-slate-700 dark:text-slate-300 border-l-4 border-brand-500 pl-4 my-6 text-left w-full mt-6">
                  "{profile.bioQuote}"
                </p>
              )}
            </div>
            <div className="space-y-2 pt-4">
              <button
                type="button"
                onClick={() => Maps('/edit-profile')}
                className="w-full bg-blue-500 text-white hover:bg-blue-600 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                onClick={logout}
                className="w-full py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Right Column (Data) */}
          <div className="lg:col-span-2 space-y-3">
            {profile.bio && (
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden p-6">
                <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
                  About Me
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Logistics */}
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden p-6">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
                Logistics
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <span>{profile.zones?.join(', ') || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <Wallet className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <span>
                    KES {profile.minBudget?.toLocaleString()} – KES{' '}
                    {profile.maxBudget?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <BookOpen className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  <span>
                    {profile.school} · {profile.preferredRoomType}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifestyle */}
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden p-6">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
                Lifestyle
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  profile.lifestyle.sleepTime
                    ? {
                        icon: Moon,
                        label: `Sleep: ${profile.lifestyle.sleepTime}`,
                      }
                    : null,
                  profile.lifestyle.cleanlinessLevel
                    ? {
                        icon: Sparkles,
                        label: `Cleanliness: ${profile.lifestyle.cleanlinessLevel}`,
                      }
                    : null,
                  profile.lifestyle.noiseTolerance
                    ? {
                        icon: Music,
                        label: `Noise: ${profile.lifestyle.noiseTolerance}`,
                      }
                    : null,
                ]
                  .filter((pill): pill is { icon: typeof Moon; label: string } => !!pill)
                  .map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-600/60 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      {label}
                    </span>
                  ))}
              </div>
            </div>

            {/* Deal Breakers */}
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden p-6">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
                Deal Breakers
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  profile.dealBreakers.noSmokingRequired && {
                    label: 'No Smoking',
                    icon: Ban,
                  },
                  profile.dealBreakers.noAlcoholRequired && {
                    label: 'No Alcohol',
                    icon: Ban,
                  },
                  profile.dealBreakers.femaleOnly && {
                    label: 'Female Only',
                    icon: PersonStanding,
                  },
                  profile.dealBreakers.maleOnly && {
                    label: 'Male Only',
                    icon: PersonStanding,
                  },
                ]
                  .filter((deal): deal is Exclude<typeof deal, false> => !!deal)
                  .map((deal) => (
                    <span
                      key={deal.label}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-200"
                    >
                      <deal.icon className="h-4 w-4 text-red-500 dark:text-red-300" />
                      {deal.label}
                    </span>
                  ))}
                {![
                  profile.dealBreakers.noSmokingRequired,
                  profile.dealBreakers.noAlcoholRequired,
                  profile.dealBreakers.femaleOnly,
                  profile.dealBreakers.maleOnly,
                ].some(Boolean) && (
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    No deal-breakers specified.
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden p-6">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-4">
                Account Settings
              </h2>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                        Profile Status
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Pause your profile to hide it from the Discover feed without deleting your data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleStatus}
                      aria-label="Toggle profile status"
                      className={`${isPaused ? 'bg-slate-400 dark:bg-slate-600' : 'bg-emerald-500'} relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${isPaused ? 'translate-x-1' : 'translate-x-6'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {profileStatus === 'active' ? 'Active' : 'Paused'}
                  </p>
                </div>

                {isHost && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Manage Listings
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Edit or delete your uploaded rooms.
                    </p>
                    <button
                      type="button"
                      onClick={() => Maps('/listings')}
                      className="mt-3 inline-flex items-center rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                      Go to Listings
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
