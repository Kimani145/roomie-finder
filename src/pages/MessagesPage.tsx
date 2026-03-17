import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { getUserProfile } from '@/firebase/profiles';
import { fetchListingsByHostIds } from '@/firebase/listings';
import { calculateCompatibilityScore, getCompatibilityPercentage } from '@/engine/compatibilityEngine';
import { formatTimeAgo, getMatchBadgeClasses } from '@/utils/formatters';
import type { UserProfile } from '@/types';

type InboxThread = {
  chatId: string;
  otherUser: UserProfile | null;
  lastMessage: string;
  updatedAt: number;
  matchPercentage: number | null;
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    let cancelled = false;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const baseThreads = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data() as {
                participants?: string[];
                lastMessage?: string;
                updatedAt?: { toDate?: () => Date } | null;
              };
              const participants = data.participants ?? [];
              const otherUid = participants.find((id) => id !== currentUser.uid);

              let otherUser: UserProfile | null = null;

              if (otherUid) {
                try {
                  otherUser = await getUserProfile(otherUid);
                } catch (profileError) {
                  console.error('Failed to load thread profile:', profileError);
                }
              }

              const updatedAt =
                data.updatedAt && typeof data.updatedAt.toDate === 'function'
                  ? data.updatedAt.toDate().getTime()
                  : 0;

              return {
                chatId: docSnap.id,
                otherUser,
                lastMessage: data.lastMessage ?? '',
                updatedAt,
              };
            })
          );

          const hostIds =
            currentUser.role === 'SEEKER'
              ? Array.from(
                  new Set(
                    baseThreads
                      .map((thread) =>
                        thread.otherUser?.role === 'HOST'
                          ? thread.otherUser.uid
                          : null
                      )
                      .filter((id): id is string => Boolean(id))
                  )
                )
              : [];

          const listingsByHostId =
            hostIds.length > 0 ? await fetchListingsByHostIds(hostIds) : {};

          const threads = baseThreads.map((thread) => {
            const listing =
              currentUser.role === 'SEEKER' && thread.otherUser?.role === 'HOST'
                ? listingsByHostId[thread.otherUser.uid]
                : undefined;
            const matchPercentage =
              thread.otherUser && currentUser
                ? getCompatibilityPercentage(
                    calculateCompatibilityScore(
                      currentUser,
                      thread.otherUser,
                      listing
                    ).totalScore
                  )
                : null;

            return {
              ...thread,
              matchPercentage,
            };
          });

          if (!cancelled) {
            setInboxThreads(threads);
            setIsLoading(false);
          }
        } catch (snapshotError) {
          console.error('Failed to load chats:', snapshotError);
          if (!cancelled) {
            setError('Sorry, we could not load your chats right now.');
            setIsLoading(false);
          }
        }
      },
      (snapshotError) => {
        console.error('Failed to load chats:', snapshotError);
        if (!cancelled) {
          setError('Sorry, we could not load your chats right now.');
          setIsLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [currentUser]);

  const formatUpdatedAt = (timestamp: number) => {
    if (!timestamp) return '';
    return formatTimeAgo(new Date(timestamp));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-2xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-6">
        Messages
      </h1>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-400/40 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-200 mb-6">
          {error}
        </div>
      )}

      {!isLoading && inboxThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
            You haven't started any conversations yet. Message one of your
            matches to begin.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            View Matches
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div>
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600"
                >
                  <Skeleton className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-slate-700" />
                    <Skeleton className="h-3 w-64 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <Skeleton className="h-3 w-12 bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : (
            inboxThreads.map((thread) => (
              <div
                key={thread.chatId}
                onClick={() => navigate('/chat/' + thread.chatId)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600/40 cursor-pointer transition-colors"
              >
                {thread.otherUser?.photoURL ? (
                  <img
                    src={thread.otherUser.photoURL}
                    alt={thread.otherUser.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-700/40 flex items-center justify-center text-brand-700 dark:text-brand-200 font-syne font-bold text-lg shrink-0">
                    {thread.otherUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                          {thread.otherUser?.displayName ?? 'Unknown'}
                        </h3>
                        {thread.matchPercentage !== null && (
                          <span
                            className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getMatchBadgeClasses(
                              thread.matchPercentage
                            )}`}
                          >
                            {thread.matchPercentage}% Match
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                        {thread.otherUser
                          ? thread.otherUser.role === 'HOST'
                            ? `Host in ${thread.otherUser.zones?.[0] ?? '—'}`
                            : thread.otherUser.role === 'SEEKER'
                              ? 'Seeker'
                              : 'Flexible'
                          : '—'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatUpdatedAt(thread.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[80%]">
                    {thread.lastMessage || 'No messages yet.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MessagesPage
