import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { X } from 'lucide-react';

type MatchState = 'idle' | 'triggered' | 'animating' | 'resolved';

export const MatchOverlay: React.FC = () => {
  const { matchData, closeMatch } = useMatchStore();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<MatchState>('idle');

  // Locked Timings
  const SUSPENSE_MS = 200;
  const ANIM_DURATION = 1; // framer-motion uses seconds
  const CTA_DELAY_MS = 300;

  useEffect(() => {
    if (matchData) {
      setPhase('triggered');
      const suspenseTimer = setTimeout(() => setPhase('animating'), SUSPENSE_MS);
      const resolveTimer = setTimeout(() => setPhase('resolved'), SUSPENSE_MS + (ANIM_DURATION * 1000));
      return () => { clearTimeout(suspenseTimer); clearTimeout(resolveTimer); };
    } else {
      setPhase('idle');
    }
  }, [matchData]);

  if (!matchData) return null;

  const handleChat = () => {
    closeMatch();
    navigate(`/messages/${matchData.matchId}`);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
      >
        {/* Dismiss Button */}
        {phase === 'resolved' && (
           <button onClick={closeMatch} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors">
             <X className="w-8 h-8" />
           </button>
        )}

        <div className="relative flex flex-col items-center">
          {/* The Circles Area */}
          <div className="relative w-64 h-32 flex items-center justify-center mb-8">
             {/* Left Circle (Brand Blue) */}
             <motion.div
               initial={{ x: -100, scale: 0.9, opacity: 0 }}
               animate={{ 
                 x: phase === 'animating' ? 20 : (phase === 'resolved' ? 20 : -100), 
                 scale: phase === 'resolved' ? 1 : (phase === 'animating' ? [0.9, 1.05, 1] : 0.9),
                 opacity: phase !== 'triggered' ? 1 : 0
               }}
               transition={{ duration: ANIM_DURATION, ease: "easeOut" }}
               className="absolute w-32 h-32 rounded-full bg-blue-500 shadow-2xl z-10 overflow-hidden border-4 border-slate-900"
             >
               {phase === 'resolved' && <img src="/assets/favicon.svg" alt="You" className="w-full h-full object-cover opacity-50 bg-slate-100" />}
             </motion.div>

             {/* Right Circle (Emerald) */}
             <motion.div
               initial={{ x: 100, scale: 0.9, opacity: 0 }}
               animate={{ 
                 x: phase === 'animating' ? -20 : (phase === 'resolved' ? -20 : 100), 
                 scale: phase === 'resolved' ? 1 : (phase === 'animating' ? [0.9, 1.05, 1] : 0.9),
                 opacity: phase !== 'triggered' ? 1 : 0
               }}
               transition={{ duration: ANIM_DURATION, ease: "easeOut" }}
               className="absolute w-32 h-32 rounded-full bg-emerald-500 shadow-2xl mix-blend-multiply z-20 overflow-hidden border-4 border-slate-900"
             >
               {phase === 'resolved' && <img src={matchData.matchedUser.photoURL || '/assets/favicon.svg'} alt="Match" className="w-full h-full object-cover bg-slate-100" />}
             </motion.div>
          </div>

          {/* Typography & CTA */}
          <AnimatePresence>
            {phase === 'resolved' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: CTA_DELAY_MS / 1000 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div>
                  <h2 className="text-4xl font-syne font-bold text-white mb-2">It's a Match!</h2>
                  <p className="text-slate-300">You and {matchData.matchedUser.displayName} liked each other.</p>
                </div>

                <div className="flex flex-col w-full max-w-xs gap-3">
                  <button onClick={handleChat} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all active:scale-[0.98]">
                    Start Chatting
                  </button>
                  <button onClick={closeMatch} className="w-full py-4 bg-transparent text-slate-400 hover:text-white font-medium rounded-xl transition-colors">
                    Keep Browsing
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
