// TODO (V2): Implement custom chat themes. Store { themeColor: 'gradient-purple' } in chats/{chatId} doc.
import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addDoc,
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
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/store/authStore'

type ChatMessage = {
  id: string
  senderUid: string
  text: string
  createdAt: number
}

type ChatHeaderProfile = {
  displayName?: string
  photoURL?: string | null
}

const ChatPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>()
  const chatId = matchId
  const { currentUser } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [otherUser, setOtherUser] = useState<ChatHeaderProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
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

  useEffect(() => {
    if (!chatId) return

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
  }, [chatId, currentUser])

  useEffect(() => {
    if (!chatId || !currentUser) return

    const otherUid = chatId.split('_').find((id) => id !== currentUser.uid)
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!chatId || !currentUser) return

    const trimmed = newMessage.trim()
    if (!trimmed) return

    setNewMessage('')
    setIsSending(true)

    try {
      const participants = chatId.split('_')
      const chatRef = doc(db, 'chats', chatId)
      await setDoc(
        chatRef,
        {
          participants,
          lastMessage: trimmed,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderUid: currentUser.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: trimmed,
        lastMessageTime: serverTimestamp(),
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen w-full max-w-4xl mx-auto border-x border-slate-200 dark:border-slate-700 shadow-sm relative bg-white dark:bg-slate-900">
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shrink-0 z-10">
        <Link to="/matches" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </Link>
        {otherUser?.photoURL ? (
          <img
            src={otherUser.photoURL}
            alt={otherUser.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-700/40 flex items-center justify-center text-brand-700 dark:text-brand-200 font-syne font-bold text-base shrink-0">
            {otherUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
          {otherUser?.displayName ?? 'Chat'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-slate-50 dark:bg-slate-950">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-slate-500 my-auto">
            Start the conversation
          </p>
        ) : (
          (() => {
            let lastDate: string | null = null
            return messages.map((message) => {
              const messageDate = formatMessageDate(message.createdAt)
              const showDate = messageDate !== lastDate
              lastDate = messageDate
              const timeLabel = formatMessageTime(message.createdAt)
              const isMine = message.senderUid === currentUser?.uid

              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-6">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {messageDate}
                      </span>
                    </div>
                  )}
                  {isMine ? (
                    <div className="flex justify-end mb-4">
                      <div className="bg-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm max-w-[80%] break-words">
                        {message.text}
                        <div className="text-[10px] text-brand-100 text-right mt-1">
                          {timeLabel}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[80%] break-words">
                        {message.text}
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-left mt-1">
                          {timeLabel}
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

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isSending}
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
