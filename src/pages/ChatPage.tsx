// TODO (V2): Implement custom chat themes. Store { themeColor: 'gradient-purple' } in chats/{chatId} doc.
import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ArrowLeft, MoreVertical, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/firebase/config'
import { markAllNotificationsReadForMatch } from '@/firebase/notifications'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import {
  getChatParticipants,
  getOtherParticipantUid,
  markChatAsRead,
  sendChatMessage,
} from '@/hooks/useChat'

type ChatMessage = {
  id: string
  senderUid: string
  text: string
  createdAt: number
}

type ChatHeaderProfile = {
  displayName?: string
  photoURL?: string | null
  uid?: string
  role?: string
}

const ChatPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>()
  const chatId = matchId
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuthStore()
  const markNotificationsReadForMatchLocal = useNotificationStore(
    (state) => state.markNotificationsReadForMatchLocal
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [otherUser, setOtherUser] = useState<ChatHeaderProfile | null>(null)
  const [isSafetyMenuOpen, setIsSafetyMenuOpen] = useState(false)
  const [isSafetyActionPending, setIsSafetyActionPending] = useState(false)
  const [chatReady, setChatReady] = useState(false)
  const [chatLoadError, setChatLoadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const safetyMenuRef = useRef<HTMLDivElement | null>(null)
  const lastNotifiedMessageIdRef = useRef<string | null>(null)
  const hasLoadedMessagesRef = useRef(false)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (isSameDay(date, today)) return 'Today'
    if (isSameDay(date, yesterday)) return 'Yesterday'

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const formatMessageTime = (timestamp: number) =>
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp))

  const formatSeparator = (timestamp: number) =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp))

  const handleBack = () => {
    navigate(
      (location.state as { from?: string } | null)?.from || '/messages'
    )
  }

  useEffect(() => {
    if (!chatId || !currentUser) {
      setChatReady(false)
      setChatLoadError(null)
      return
    }

    let cancelled = false
    hasLoadedMessagesRef.current = false
    lastNotifiedMessageIdRef.current = null
    setChatReady(false)
    setChatLoadError(null)
    setMessages([])

    ;(async () => {
      try {
        const chatRef = doc(db, 'chats', chatId)
        const matchSnap = await getDoc(doc(db, 'matches', chatId))
        const matchData = matchSnap.data() as {
          participants?: string[]
          status?: string
        } | undefined
        const participants = matchData?.participants ?? getChatParticipants(chatId)

        if (
          !matchSnap.exists() ||
          matchData?.status !== 'matched' ||
          participants.length !== 2 ||
          !participants.includes(currentUser.uid)
        ) {
          throw new Error('chat-unavailable')
        }

        await setDoc(
          chatRef,
          {
            participants,
            status: 'matched',
          },
          { merge: true }
        )

        if (!cancelled) {
          setChatReady(true)
        }
      } catch (error) {
        console.error('Failed to initialize chat thread:', error)
        if (!cancelled) {
          setChatLoadError('This conversation is not available right now.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [chatId, currentUser])

  useEffect(() => {
    if (!chatId || !chatReady) return

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextMessages = snapshot.docs.map((docSnap) => {
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

      setMessages(nextMessages)

      if (!currentUser) return
      const latestMessage = nextMessages[nextMessages.length - 1]
      if (!latestMessage) {
        hasLoadedMessagesRef.current = true
        return
      }

      if (!hasLoadedMessagesRef.current) {
        lastNotifiedMessageIdRef.current = latestMessage.id
        hasLoadedMessagesRef.current = true
        return
      }

      if (
        latestMessage.id !== lastNotifiedMessageIdRef.current &&
        latestMessage.senderUid !== currentUser.uid
      ) {
        toast('💬 New message', { icon: '👋' })
      }

      lastNotifiedMessageIdRef.current = latestMessage.id
    })

    return () => unsubscribe()
  }, [chatId, chatReady, currentUser])

  useEffect(() => {
    if (!chatId || !currentUser) return

    const otherUid = getOtherParticipantUid(chatId, currentUser.uid)
    if (!otherUid) return

    let cancelled = false
    ;(async () => {
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', otherUid))
        if (!cancelled && profileSnap.exists()) {
          const data = profileSnap.data() as ChatHeaderProfile
          setOtherUser({
            displayName: data.displayName ?? 'Unknown',
            photoURL: data.photoURL ?? null,
            uid: otherUid,
            role: data.role ?? 'Member',
          })
        }
      } catch (error) {
        console.error('Failed to load chat profile:', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [chatId, currentUser])

  useEffect(() => {
    if (!chatId || !currentUser || !chatReady) return

    const markAsRead = async () => {
      try {
        const otherUid = getOtherParticipantUid(chatId, currentUser.uid)
        await markChatAsRead(chatId, currentUser.uid)
        await markAllNotificationsReadForMatch({
          recipientId: currentUser.uid,
          matchId: chatId,
          senderId: otherUid,
        })
        markNotificationsReadForMatchLocal(chatId)
      } catch (error) {
        console.error('Failed to mark chat as read:', error)
      }
    }

    markAsRead()
  }, [chatId, chatReady, currentUser, markNotificationsReadForMatchLocal])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isSafetyMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        safetyMenuRef.current &&
        !safetyMenuRef.current.contains(event.target as Node)
      ) {
        setIsSafetyMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSafetyMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isSafetyMenuOpen])

  const unmatchChat = async ({
    skipConfirm = false,
    showSuccessToast = true,
    navigateAfter = true,
  }: {
    skipConfirm?: boolean
    showSuccessToast?: boolean
    navigateAfter?: boolean
  } = {}) => {
    if (!chatId) return false

    if (
      !skipConfirm &&
      !window.confirm(
        'Are you sure you want to unmatch? This action cannot be undone.'
      )
    ) {
      return false
    }

    try {
      setIsSafetyActionPending(true)
      await setDoc(
        doc(db, 'chats', chatId),
        {
          status: 'unmatched',
          unreadBy: [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      await updateDoc(doc(db, 'matches', chatId), {
        status: 'archived',
      })

      setIsSafetyMenuOpen(false)
      if (showSuccessToast) {
        toast.success('Unmatched successfully.')
      }

      if (navigateAfter) {
        navigate('/matches')
      }

      return true
    } catch (error) {
      console.error('Failed to unmatch user:', error)
      toast.error('We could not unmatch this conversation right now.')
      return false
    } finally {
      setIsSafetyActionPending(false)
    }
  }

  const handleUnmatch = async () => {
    await unmatchChat()
  }

  const handleReport = async () => {
    if (!currentUser?.uid || !otherUser?.uid) {
      toast.error('We could not identify this user for reporting.')
      return
    }

    const reason = window.prompt(
      'Briefly describe why you are reporting this user:'
    )?.trim()

    if (!reason) return

    try {
      setIsSafetyActionPending(true)
      await setDoc(doc(collection(db, 'reports')), {
        reportedUserId: otherUser.uid,
        reportedBy: currentUser.uid,
        reason,
        createdAt: serverTimestamp(),
        status: 'pending',
      })

      const didUnmatch = await unmatchChat({
        skipConfirm: true,
        showSuccessToast: false,
        navigateAfter: false,
      })
      if (!didUnmatch) return
      toast.success('User reported. Our safety team will review this shortly.')
      navigate('/matches')
    } catch (error) {
      console.error('Failed to report user:', error)
      toast.error('We could not submit your report right now.')
    } finally {
      setIsSafetyActionPending(false)
    }
  }

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!chatId || !currentUser || !chatReady) return

    const trimmed = newMessage.trim()
    if (!trimmed) return

    setNewMessage('')
    setIsSending(true)

    try {
      await sendChatMessage({
        chatId,
        currentUserUid: currentUser.uid,
        text: trimmed,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(
        error instanceof Error && error.message === 'chat-unmatched'
          ? 'This conversation is no longer available.'
          : 'We could not send your message right now.'
      )
      setNewMessage(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="shrink-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <Link
            to={otherUser?.uid ? `/profile/${otherUser.uid}` : '/messages'}
            onClick={(e) => {
              if (!otherUser?.uid) {
                e.preventDefault()
              }
            }}
            className="flex items-center gap-3 group min-w-0"
          >
            {otherUser?.photoURL ? (
              <img
                src={otherUser.photoURL}
                alt={otherUser.displayName ?? 'Avatar'}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-700/40 flex items-center justify-center text-brand-700 dark:text-brand-200 font-syne font-bold text-base shrink-0 group-hover:opacity-80 transition-opacity">
                {otherUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-syne font-bold text-slate-900 dark:text-slate-50">
                {otherUser?.displayName ?? 'Chat'}
              </h2>
              <p className="text-xs text-brand-500 font-medium">
                {otherUser?.role ?? 'Member'}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center">
          <div className="relative" ref={safetyMenuRef}>
            <button
              type="button"
              onClick={() => setIsSafetyMenuOpen((isOpen) => !isOpen)}
              disabled={isSafetyActionPending}
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-haspopup="menu"
              aria-expanded={isSafetyMenuOpen}
              aria-label="Open trust and safety menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {isSafetyMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                role="menu"
              >
                <button
                  type="button"
                  onClick={handleUnmatch}
                  disabled={isSafetyActionPending}
                  className="block w-full px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  Unmatch
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={isSafetyActionPending}
                  className="block w-full px-4 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                  role="menuitem"
                >
                  Report user
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {chatLoadError && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
          {chatLoadError}
        </div>
      )}

      {!chatReady && !chatLoadError && (
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Preparing conversation...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-slate-500 my-auto">
            {chatReady ? 'Start the conversation' : 'Opening conversation...'}
          </p>
        ) : (
          (() => {
            let lastDate: string | null = null
            return messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null
              const messageDate = formatMessageDate(message.createdAt)
              const showDate = messageDate !== lastDate
              lastDate = messageDate
              const timeLabel = formatMessageTime(message.createdAt)
              const isMine = message.senderUid === currentUser?.uid
              const isConsecutive =
                Boolean(previousMessage) &&
                previousMessage?.senderUid === message.senderUid &&
                message.createdAt - previousMessage.createdAt < 300000
              const showTimeSeparator =
                Boolean(previousMessage) &&
                message.createdAt - (previousMessage?.createdAt ?? 0) > 3600000

              return (
                <React.Fragment key={message.id}>
                  {showTimeSeparator && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/60">
                        {formatSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}
                  {showDate && (
                    <div className="flex justify-center my-6">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {messageDate}
                      </span>
                    </div>
                  )}
                  {isMine ? (
                    <div className={`flex justify-end ${isConsecutive ? 'mt-1' : 'mt-4'} mb-1`}>
                      <div className="bg-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%] break-words">
                        {message.text}
                        <div className="text-[10px] text-brand-100 text-right mt-1">
                          {timeLabel}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex justify-start ${isConsecutive ? 'mt-1' : 'mt-4'} mb-1`}>
                      {!isConsecutive && (
                        <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-700/40 flex items-center justify-center text-brand-700 dark:text-brand-200 font-syne font-bold text-xs shrink-0 mr-2 mt-1">
                          {otherUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        {!isConsecutive && (
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            {otherUser?.displayName ?? 'Member'}
                          </p>
                        )}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[80%] break-words">
                          {message.text}
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-left mt-1">
                            {timeLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4">
        <form onSubmit={sendMessage} className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder={
              chatLoadError
                ? 'Conversation unavailable'
                : chatReady
                  ? 'Type your message...'
                  : 'Preparing conversation...'
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!chatReady || Boolean(chatLoadError) || isSending}
            className="flex-1 bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isSending || !chatReady || Boolean(chatLoadError)}
            className="p-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPage
