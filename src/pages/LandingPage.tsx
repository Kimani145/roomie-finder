import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

const LandingPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
        <ShieldCheck className="h-8 w-8 text-blue-400" />
      </div>

      <h1 className="mb-4 font-display text-5xl font-bold text-white">
        Find your people. Find your place.
      </h1>
      <p className="mb-8 max-w-md text-lg text-slate-300">
        Student roommate matching built around compatibility, not listings.
      </p>
      <p className="mb-8 text-xs text-slate-500">
        Exclusively for Technical University of Kenya students.
      </p>
      
      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link
          to="/signup"
          className="rounded-xl bg-blue-500 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-600 active:scale-95"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="rounded-xl border-2 border-slate-700 px-8 py-3 font-semibold text-slate-300 transition-all hover:bg-slate-800 active:scale-95"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}

export default LandingPage
