import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { MessageSquare, Send, Smile, AlertCircle, AlertTriangle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ReportModal } from '@/components/ui'
import type { EmojiClickData } from 'emoji-picker-react'

const EmojiPicker = React.lazy(() => import('emoji-picker-react'))
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore'
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
import { categorizeMessageDate, formatMessageTime } from '@/utils/dateUtils'
import { 
  markChatAsRead, 
  sendChatMessageWithOptimism,
  retryFailedMessage,
} from '@/hooks/useChat'
import type { UserProfile, MessageStatus } from '@/types'

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
  createdAt: number | Date
  status?: MessageStatus
  tempId?: string
  failureReason?: string
}

const MessagesPage: React.FC = () => {
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId?: string }>()
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  )
  const { currentUser } = useAuthStore()

  const [inboxThreads, setInboxThreads] = useState<InboxThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  
  useEffect(() => {
    if (matchId) {
      setSelectedChatId(matchId)
    } else if (isDesktopLayout && inboxThreads.length > 0 && !selectedChatId) {
      navigate(`/messages/${inboxThreads[0].chatId}`, { replace: true })
    }
  }, [matchId, isDesktopLayout, inboxThreads, navigate, selectedChatId])
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [userNearBottom, setUserNearBottom] = useState(true)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  

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

  // Decoupled thread initialization: independently fetch chat metadata when matchId exists
  useEffect(() => {
    if (!matchId || !currentUser) {
      return
    }

    let cancelled = false

    const initializeMatchIdChat = async () => {
      try {
        const chatRef = doc(db, 'chats', matchId)
        const chatSnap = await getDoc(chatRef)
        const chatData = chatSnap.data() as {
          participants?: string[]
          lastMessage?: string
          updatedAt?: { toDate?: () => Date } | null
          status?: string
          unreadBy?: string[]
        } | undefined

        if (cancelled) return

        if (!chatData || chatData.status === 'unmatched') {
          console.warn('Chat not found or unmatched:', matchId)
          return
        }

        const participants = chatData.participants ?? []
        const otherUid = participants.find((id) => id !== currentUser.uid)

        if (!otherUid) {
          console.warn('Could not find other participant in chat')
          return
        }

        let otherUser: UserProfile | null = null
        try {
          otherUser = await getUserProfile(otherUid)
        } catch (profileError) {
          console.error('Failed to load chat profile:', profileError)
        }

        if (cancelled) return

        const updatedAt =
          chatData.updatedAt && typeof chatData.updatedAt.toDate === 'function'
            ? chatData.updatedAt.toDate().getTime()
            : 0

        const listing =
          currentUser.role === 'SEEKER' && otherUser?.role === 'HOST'
            ? (await fetchListingsByHostIds([otherUid]))[otherUid]
            : undefined

        const matchPercentage =
          otherUser && currentUser
            ? getCompatibilityPercentage(
                calculateCompatibilityScore(
                  currentUser,
                  otherUser,
                  listing
                ).totalScore
              )
            : null

        if (!cancelled) {
          const matchIdThread: InboxThread = {
            chatId: matchId,
            otherUser,
            lastMessage: chatData.lastMessage ?? '',
            updatedAt,
            status: chatData.status,
            unreadBy: chatData.unreadBy ?? [],
            matchPercentage,
          }

          // Add to threads if not already present
          setInboxThreads((prevThreads) => {
            const exists = prevThreads.some((t) => t.chatId === matchId)
            if (exists) {
              return prevThreads.map((t) =>
                t.chatId === matchId ? matchIdThread : t
              )
            }
            return [matchIdThread, ...prevThreads]
          })

          setSelectedChatId(matchId)
        }
      } catch (error) {
        console.error('Failed to initialize matchId chat:', error)
      }
    }

    void initializeMatchIdChat()

    return () => {
      cancelled = true
    }
  }, [matchId, currentUser])

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
            if (threads.length > 0 && !selectedChatId && !matchId && isDesktopLayout) {
              navigate(`/messages/${threads[0].chatId}`, { replace: true })
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

  // Auto-scroll and scroll-to-read tracking with IntersectionObserver
  useEffect(() => {
    if (!messagesEndRef.current) return

    let scrollTimeout: ReturnType<typeof setTimeout>

    // Only auto-scroll if user is near bottom
    if (userNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Set up IntersectionObserver for scroll-to-read
    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries
        // When messagesEndRef (bottom) becomes visible, mark as read
        if (entry.isIntersecting && currentUser && selectedChatId) {
          setUserNearBottom(true)
          scrollTimeout = setTimeout(async () => {
            try {
              await markChatAsRead(selectedChatId, currentUser.uid)
            } catch (error) {
              console.error('Failed to mark chat as read:', error)
            }
          }, 500)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(messagesEndRef.current)

    return () => {
      clearTimeout(scrollTimeout)
      observer.disconnect()
    }
  }, [threadMessages, otherUserTyping, currentUser, selectedChatId, userNearBottom])

  // Track scroll position to detect if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
      
      // User is near bottom if less than 100px from bottom
      setUserNearBottom(distanceFromBottom < 100)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

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
    navigate(`/messages/${chatId}`)
  }

  const handleBackToInbox = () => {
    navigate('/messages')
    setSelectedChatId(null)
  }

  const handleSendMessage = async () => {
    if (!currentUser || !selectedThread || !messageText.trim() || isSending) return

    setIsSending(true)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const messageToSend = messageText.trim()

    try {
      // Send with optimistic UI
      const result = await sendChatMessageWithOptimism({
        chatId: selectedThread.chatId,
        currentUserUid: currentUser.uid,
        text: messageToSend,
        tempId,
        onOptimisticMessage: (msg) => {
          setThreadMessages((prev) => [...prev, msg])
        },
      })

      if (!result.success) {
        // Mark as failed
        setThreadMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? {
                  ...msg,
                  status: 'FAILED' as MessageStatus,
                  failureReason: result.error || 'Failed to send',
                  id: msg.id || tempId,
                }
              : msg
          )
        )
        console.error('Failed to send message:', result.error)
      } else {
        // Mark as acknowledged
        setThreadMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? {
                  ...msg,
                  status: 'SERVER_ACKNOWLEDGED' as MessageStatus,
                  id: result.serverMessageId || msg.id,
                }
              : msg
          )
        )
      }

      setMessageText('')
      setShowEmojiPicker(false)
    } catch (sendError) {
      console.error('Failed to send message:', sendError)
      // Mark as failed
      setThreadMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...msg,
                status: 'FAILED' as MessageStatus,
                failureReason: 'Network error',
                id: msg.id || tempId,
              }
            : msg
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleRetryMessage = async (tempId: string) => {
    const failedMsg = threadMessages.find((msg) => msg.tempId === tempId)
    if (!failedMsg) return

    const result = await retryFailedMessage({
      chatId: selectedThread!.chatId,
      currentUserUid: currentUser!.uid,
      text: failedMsg.text,
      tempId,
    })

    if (result.success) {
      setThreadMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...msg,
                status: 'SERVER_ACKNOWLEDGED' as MessageStatus,
                id: result.serverMessageId || msg.id,
              }
            : msg
        )
      )
    }
  }

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji)
  }

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1220]">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-amber-500/30 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
          {error}
        </div>
      )}

      {!isLoading && inboxThreads.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full">
          <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
            You haven&apos;t started any conversations yet. Message one of your matches to begin.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-6 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            View Matches
          </button>
        </div>
      ) : (
        <>
          <section className={`w-full md:w-80 lg:w-96 h-full flex flex-col border-r border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#111827] shrink-0 ${selectedChatId && !isDesktopLayout ? 'hidden' : 'block'}`}>
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
              <div className="flex-1 overflow-y-auto">
                {inboxThreads.map((thread) => {
                  const isUnread = currentUser && thread.unreadBy?.includes(currentUser.uid)
                  const isSelected = isDesktopLayout && selectedChatId === thread.chatId

                  return (
                    <div
                      key={thread.chatId}
                      onClick={() => handleThreadClick(thread.chatId)}
                      className={`flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-700/50 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-800 border-l-4 border-l-brand-600'
                          : isUnread
                            ? 'bg-blue-50/80 dark:bg-blue-900/15 border-l-4 border-l-brand-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Link
                        to={`/profile/${thread.otherUser?.uid}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 relative"
                      >
                        {thread.otherUser?.photoURL ? (
                          <img
                            src={thread.otherUser.photoURL}
                            alt={thread.otherUser.displayName}
                            className={`w-14 h-14 rounded-full object-cover ${isUnread ? 'ring-2 ring-brand-600' : ''}`}
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-syne font-bold text-lg ${isUnread ? 'ring-2 ring-brand-600' : ''}`}>
                            {thread.otherUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        {isUnread && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-600 rounded-full border-2 border-white dark:border-slate-900"></div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3
                                className={`font-semibold truncate ${
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
                          <span className={`text-xs whitespace-nowrap ${isUnread ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                            {formatUpdatedAt(thread.updatedAt)}
                          </span>
                        </div>
                        <p
                          className={`text-sm truncate ${
                            isUnread
                              ? 'text-slate-900 dark:text-white font-medium'
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

          <section className={`flex-1 flex-col h-full bg-[#F8FAFC] dark:bg-[#0B1220] ${!selectedChatId && !isDesktopLayout ? 'hidden' : 'flex'}`}>
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Select a thread to view messages.
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#111827]">
                  <div className="flex items-center gap-3">
                    {!isDesktopLayout && (
                      <button onClick={handleBackToInbox} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      </button>
                    )}
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {selectedThread.otherUser?.displayName ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedThread.otherUser?.role ?? 'Member'}
                      </p>
                    </div>
                  </div>
                  {selectedThread.otherUser && (
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="p-2 rounded-xl border border-red-500/20 hover:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Report User"
                      aria-label="Report User"
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {threadMessages.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-12">
                      No messages yet. Start the conversation.
                    </p>
                   ) : (
                    threadMessages.map((message, index) => {
                      const isMine = message.senderUid === currentUser?.uid
                      const isFailed = message.status === 'FAILED'
                      const isPending = message.status === 'LOCAL_PENDING'
                      const showDateLabel = 
                        index === 0 || 
                        categorizeMessageDate(threadMessages[index - 1]?.createdAt) !== 
                        categorizeMessageDate(message.createdAt)

                      return (
                        <div key={message.id || message.tempId}>
                          {showDateLabel && (
                            <div className="flex justify-center my-3">
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {categorizeMessageDate(message.createdAt)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-2`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                                isMine
                                  ? `bg-brand-600 text-white ${isPending ? 'opacity-70' : ''} ${isFailed ? 'opacity-60 border border-red-400' : ''}`
                                  : `bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-700/50 ${isPending ? 'opacity-70' : ''}`
                              }`}
                            >
                              <p>{message.text}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-1 text-xs text-slate-500 dark:text-slate-400">
                              <span>{formatMessageTime(message.createdAt)}</span>
                              {isMine && (
                                <>
                                  {isPending && <span className="text-amber-600 dark:text-amber-400">Sending...</span>}
                                  {isFailed && (
                                    <>
                                      <AlertCircle className="w-3 h-3 text-red-500" />
                                      <span className="text-red-600 dark:text-red-400">{message.failureReason}</span>
                                      <button
                                        onClick={() => handleRetryMessage(message.tempId!)}
                                        className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        Retry
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
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

                <div className="shrink-0 p-4 bg-[#FFFFFF] dark:bg-[#111827] border-t border-[#E2E8F0] dark:border-[#334155] relative">
                  {showEmojiPicker && (
                    <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Suspense fallback={<div className="p-4 bg-[#FFFFFF] dark:bg-[#111827] text-xs text-slate-500">Loading picker...</div>}>
                        <EmojiPicker onEmojiClick={onEmojiClick} theme={'auto' as any} />
                      </Suspense>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
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
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-600"
                    />
                    <button
                      type="button"
                      disabled={!messageText.trim() || isSending}
                      onClick={() => void handleSendMessage()}
                      className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center disabled:bg-blue-300"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {selectedThread?.otherUser && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedId={selectedThread.otherUser.uid}
          type="chat"
          reportedName={selectedThread.otherUser.displayName}
        />
      )}
    </div>
  )
}

export default MessagesPage
