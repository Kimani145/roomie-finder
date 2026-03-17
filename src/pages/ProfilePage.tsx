import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/firebase/profiles';
import type { UserProfile } from '@/types';
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
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentUser } = useAuthStore();
  const Maps = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(currentUser);
  const [loading, setLoading] = useState(!currentUser);
  const [profileStatus, setProfileStatus] = useState<'active' | 'paused'>(
    currentUser?.status === 'paused' ? 'paused' : 'active'
  );

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
  const toggleStatus = () => {
    setProfileStatus((prev) => (prev === 'active' ? 'paused' : 'active'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Loading profile…
        </span>
      </div>
    );
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
              <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-4xl font-bold text-slate-700 dark:text-slate-50 mb-4">
                {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
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
                      className={`${isPaused ? 'bg-slate-400 dark:bg-slate-600' : 'bg-emerald-500'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
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
