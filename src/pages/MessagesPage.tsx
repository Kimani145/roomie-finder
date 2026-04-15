import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send, Smile } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { getUserProfile } from '@/firebase/profiles'
import { fetchListingsByHostIds } from '@/firebase/listings'
import {
  calculateCompatibilityScore,
  getCompatibilityPercentage,
} from '@/engine/compatibilityEngine'
import { formatTimeAgo, getMatchBadgeClasses } from '@/utils/formatters'
import { markChatAsRead, sendChatMessage } from '@/hooks/useChat'
import type { UserProfile } from '@/types'

type InboxThreadRecord = {
  chatId: string
  otherUser: UserProfile | null
  lastMessage: string
  updatedAt: number
  status?: string
  unreadBy: string[]
}

type InboxThread = InboxThreadRecord & {
  matchPercentage: number | null
}

type ThreadMessage = {
  id: string
  senderUid: string
  text: string
  createdAt: number
}

const MessagesPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuthStore()

  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(min-width: 768px)')
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktopLayout(event.matches)
    }

    setIsDesktopLayout(media.matches)
    media.addEventListener('change', onChange)

    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    let cancelled = false

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const baseThreads: Array<InboxThreadRecord | null> = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data() as {
                participants?: string[]
                lastMessage?: string
                updatedAt?: { toDate?: () => Date } | null
                unreadBy?: string[]
                status?: string
              }
              if (data.status === 'unmatched') {
                return null
              }

              const participants = data.participants ?? []
              const otherUid = participants.find((id) => id !== currentUser.uid)

              let otherUser: UserProfile | null = null

              if (otherUid) {
                try {
                  otherUser = await getUserProfile(otherUid)
                } catch (profileError) {
                  console.error('Failed to load thread profile:', profileError)
                }
              }

              const updatedAt =
                data.updatedAt && typeof data.updatedAt.toDate === 'function'
                  ? data.updatedAt.toDate().getTime()
                  : 0

              return {
                chatId: docSnap.id,
                otherUser,
                lastMessage: data.lastMessage ?? '',
                updatedAt,
                status: data.status,
                unreadBy: data.unreadBy ?? [],
              }
            })
          )

          const visibleThreads = baseThreads.filter(
            (thread): thread is InboxThreadRecord =>
              thread !== null && thread.status !== 'unmatched'
          )

          const hostIds =
            currentUser.role === 'SEEKER'
              ? Array.from(
                  new Set(
                    visibleThreads
                      .map((thread) =>
                        thread.otherUser?.role === 'HOST'
                          ? thread.otherUser.uid
                          : null
                      )
                      .filter((id): id is string => Boolean(id))
                  )
                )
              : []

          const listingsByHostId =
            hostIds.length > 0 ? await fetchListingsByHostIds(hostIds) : {}

          const threads: InboxThread[] = visibleThreads.map((thread) => {
            const listing =
              currentUser.role === 'SEEKER' && thread.otherUser?.role === 'HOST'
                ? listingsByHostId[thread.otherUser.uid]
                : undefined
            const matchPercentage =
              thread.otherUser && currentUser
                ? getCompatibilityPercentage(
                    calculateCompatibilityScore(
                      currentUser,
                      thread.otherUser,
                      listing
                    ).totalScore
                  )
                : null

            return {
              ...thread,
              matchPercentage,
            }
          })

          if (!cancelled) {
            setInboxThreads(threads)
            setIsLoading(false)
            if (threads.length > 0 && !selectedChatId) {
              setSelectedChatId(threads[0].chatId)
            }
            if (
              selectedChatId &&
              !threads.some((thread) => thread.chatId === selectedChatId)
            ) {
              setSelectedChatId(threads[0]?.chatId ?? null)
            }
          }
        } catch (snapshotError) {
          console.error('Failed to load chats:', snapshotError)
          if (!cancelled) {
            setError('Sorry, we could not load your chats right now.')
            setIsLoading(false)
          }
        }
      },
      (snapshotError) => {
        console.error('Failed to load chats:', snapshotError)
        if (!cancelled) {
          setError('Sorry, we could not load your chats right now.')
          setIsLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [currentUser, selectedChatId])

  useEffect(() => {
    if (!currentUser || !selectedChatId || !isDesktopLayout) {
      setThreadMessages([])
      return
    }

    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const nextMessages: ThreadMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          senderUid?: string
          senderId?: string
          text?: string
          createdAt?: { toDate?: () => Date } | null
        }

        const createdAt =
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().getTime()
            : Date.now()

        return {
          id: docSnap.id,
          senderUid: data.senderUid ?? data.senderId ?? '',
          text: data.text ?? '',
          createdAt,
        }
      })

      setThreadMessages(nextMessages)

      try {
        await markChatAsRead(selectedChatId, currentUser.uid)
      } catch (readError) {
        console.error('Failed to mark selected chat as read:', readError)
      }
    })

    return () => unsubscribe()
  }, [currentUser, isDesktopLayout, selectedChatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages, otherUserTyping])

  // Simulating typing indicator
  useEffect(() => {
    if (!messageText || isSending) return
    const randomDelay = Math.random() * 3000 + 2000
    const timeout = setTimeout(() => {
      setOtherUserTyping(true)
      setTimeout(() => setOtherUserTyping(false), 3000)
    }, randomDelay)
    return () => clearTimeout(timeout)
  }, [messageText, isSending])

  const selectedThread = useMemo(
    () => inboxThreads.find((thread) => thread.chatId === selectedChatId) ?? null,
    [inboxThreads, selectedChatId]
  )

  const formatUpdatedAt = (timestamp: number) => {
    if (!timestamp) return ''
    return formatTimeAgo(new Date(timestamp))
  }

  const handleThreadClick = (chatId: string) => {
    if (isDesktopLayout) {
      setSelectedChatId(chatId)
      return
    }

    navigate(`/chat/${chatId}`, {
      state: { from: location.pathname },
    })
  }

  const handleSendMessage = async () => {
    if (!currentUser || !selectedThread || !messageText.trim() || isSending) return

    setIsSending(true)
    try {
      await sendChatMessage({
        chatId: selectedThread.chatId,
        currentUserUid: currentUser.uid,
        text: messageText.trim(),
      })
      setMessageText('')
      setShowEmojiPicker(false)
    } catch (sendError) {
      console.error('Failed to send message from split pane:', sendError)
    } finally {
      setIsSending(false)
    }
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <h1 className="text-2xl font-syne font-bold text-slate-900 dark:text-slate-50 mb-6">
        Messages
      </h1>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300 mb-6">
          {error}
        </div>
      )}

      {!isLoading && inboxThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
            You haven&apos;t started any conversations yet. Message one of your matches to begin.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            View Matches
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-1 rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700/50 dark:bg-slate-900">
            {isLoading ? (
              <div>
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50"
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
              <div className="max-h-[70dvh] overflow-y-auto">
                {inboxThreads.map((thread) => {
                  const isUnread = currentUser && thread.unreadBy?.includes(currentUser.uid)
                  const isSelected = isDesktopLayout && selectedChatId === thread.chatId

                  return (
                    <div
                      key={thread.chatId}
                      onClick={() => handleThreadClick(thread.chatId)}
                      className={`flex items-center gap-4 p-4 border-b transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-blue-500'
                          : isUnread
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      } border-slate-100 dark:border-slate-700/50`}
                    >
                      <Link
                        to={`/profile/${thread.otherUser?.uid}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      >
                        {thread.otherUser?.photoURL ? (
                          <img
                            src={thread.otherUser.photoURL}
                            alt={thread.otherUser.displayName}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-syne font-bold text-lg">
                            {thread.otherUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3
                                className={`font-semibold ${
                                  isUnread
                                    ? 'text-slate-900 dark:text-white font-bold'
                                    : 'text-slate-900 dark:text-slate-50'
                                }`}
                              >
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
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatUpdatedAt(thread.updatedAt)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            isUnread
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400 font-normal'
                          }`}
                        >
                          {thread.lastMessage || 'No messages yet.'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="hidden md:flex md:col-span-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-900 overflow-hidden flex-col min-h-[70dvh] shadow-lg shadow-black/20">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Select a thread to view messages.
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {selectedThread.otherUser?.displayName ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedThread.otherUser?.role ?? 'Member'}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                  {threadMessages.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-12">
                      No messages yet. Start the conversation.
                    </p>
                  ) : (
                    threadMessages.map((message) => {
                      const isMine = message.senderUid === currentUser?.uid
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              isMine
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-700/50'
                            }`}
                          >
                            <p>{message.text}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  {otherUserTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-slate-200 dark:bg-slate-800 border border-slate-700/50 flex space-x-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 relative">
                  {showEmojiPicker && (
                    <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <EmojiPicker onEmojiClick={onEmojiClick} theme={'auto' as any} />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-slate-500 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleSendMessage()
                        }
                      }}
                      placeholder="Type a message"
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={!messageText.trim() || isSending}
                      onClick={() => void handleSendMessage()}
                      className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:bg-blue-300"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default MessagesPage
