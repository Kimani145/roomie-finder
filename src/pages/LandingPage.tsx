import React from 'react'
import { Link } from 'react-router-dom'

const LandingPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
      <h1 className="mb-4 font-display text-5xl font-bold text-white">
        Find your people. Find your place.
      </h1>
      <p className="mb-8 max-w-md text-lg text-slate-300">
        Student roommate matching built around compatibility, not listings.
      </p>
      
      {/* Primary CTA */}
      <div className="flex flex-col gap-3 mb-8">
        <Link
          to="/auth"
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
      
      {/* DEV ONLY: Direct link to see Discovery without auth */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
        <Link
          to="/discover"
          className="rounded-xl bg-slate-800 px-6 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700 active:scale-95"
        >
          View Discovery Feed (Demo)
        </Link>
        <p className="text-xs text-slate-500">
          ⚠️ Dev mode: Skip authentication for testing
        </p>
      </div>
    </div>
  )
}

export default LandingPage
