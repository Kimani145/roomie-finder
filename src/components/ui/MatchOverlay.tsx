import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMatchStore } from '@/store/useMatchStore'

const Avatar: React.FC<{
  src: string | null
  name: string
  className: string
  initial: { x: number; opacity: number }
  animate: { x: number; opacity: number }
}> = ({ src, name, className, initial, animate }) => {
  if (src) {
    return (
      <motion.img
        src={src}
        alt={name}
        initial={initial}
        animate={animate}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className={className}
      />
    )
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((token) => token[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
      className={`${className} bg-slate-200 text-slate-700 font-syne text-3xl font-bold flex items-center justify-center`}
      aria-label={name}
    >
      {initials || '?'}
    </motion.div>
  )
}

export const MatchOverlay: React.FC = () => {
  const navigate = useNavigate()
  const { isOpen, matchData, closeMatch } = useMatchStore()

  const handleStartChatting = () => {
    if (!matchData) return
    closeMatch()
    navigate(`/chat/${matchData.matchId}`)
  }

  return (
    <AnimatePresence>
      {isOpen && matchData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Match reveal overlay"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <button
              onClick={closeMatch}
              className="absolute right-5 top-5 rounded-full border border-slate-500/50 bg-slate-700/40 p-2 text-slate-200 hover:bg-slate-700/70"
              aria-label="Close match reveal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative mx-6 w-full max-w-xl text-center">
              <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-[100px]" />

              <div className="relative z-10 flex items-center justify-center">
                <Avatar
                  src={matchData.userA.avatar}
                  name={matchData.userA.name}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 12, opacity: 1 }}
                  className="relative z-10 h-32 w-32 rounded-full border-4 border-white object-cover shadow-2xl"
                />
                <Avatar
                  src={matchData.userB.avatar}
                  name={matchData.userB.name}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: -12, opacity: 1 }}
                  className="relative z-0 h-32 w-32 rounded-full border-4 border-white object-cover shadow-2xl"
                />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
                className="mt-10 font-syne text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                You and {matchData.userB.name} are a match!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                className="mx-auto mt-3 max-w-md text-sm text-slate-300"
              >
                You both liked each other. Start the conversation while the momentum is fresh.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.35 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
              >
                <button
                  onClick={handleStartChatting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start Chatting
                </button>
                <button
                  onClick={closeMatch}
                  className="rounded-xl border border-slate-400/50 px-6 py-3 font-semibold text-slate-100 transition hover:bg-slate-700/40"
                >
                  Keep Browsing
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MatchOverlay
