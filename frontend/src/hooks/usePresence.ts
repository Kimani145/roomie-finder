import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'

export type PresenceStatus = 'online' | 'idle' | 'offline'

interface PresenceData {
  uid: string
  onlineStatus: PresenceStatus
  lastActive: string | null
  isTyping: boolean
}

/**
   Global presence heartbeat hook to sync local user presence to backend
 */
export function usePresenceHeartbeat(uid?: string | null, typingChatId?: string | null) {
  useEffect(() => {
    if (!uid) return

    let heartbeatTimer: ReturnType<typeof setInterval>

    const sendHeartbeat = async (status: PresenceStatus = 'online') => {
      try {
        await fetchWithAuth('/api/v1/presence/heartbeat', {
          method: 'POST',
          body: JSON.stringify({
            status,
            typingChatId: typingChatId ?? null,
          }),
        })
      } catch (err) {
        logger.error('Presence heartbeat error:', err)
      }
    }

    // Send initial heartbeat
    void sendHeartbeat('online')

    // Periodic heartbeat every 30s
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat('online')
      } else {
        void sendHeartbeat('idle')
      }
    }, 30000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat('online')
      } else {
        void sendHeartbeat('idle')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(heartbeatTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Best-effort offline notification on unmount
      void sendHeartbeat('offline')
    }
  }, [uid, typingChatId])
}

/**
   Hook to fetch and monitor a specific user's presence state
 */
export function useUserPresence(targetUid?: string | null) {
  const [presence, setPresence] = useState<PresenceData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!targetUid) {
      setPresence(null)
      return
    }

    let isMounted = true

    const fetchPresence = async () => {
      try {
        setLoading(true)
        const data = await fetchWithAuth(`/api/v1/presence/${targetUid}`)
        if (isMounted) {
          setPresence(data)
        }
      } catch (err) {
        if (isMounted) {
          setPresence({
            uid: targetUid,
            onlineStatus: 'offline',
            lastActive: null,
            isTyping: false,
          })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchPresence()

    // Poll presence every 15s when viewing chat
    const timer = setInterval(() => {
      void fetchPresence()
    }, 15000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [targetUid])

  return { presence, loading }
}
