import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-syne">Access Denied</h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You do not have the required permissions to access this administrative resource. 
          This attempt has been logged.
        </p>
        
        <button
          onClick={() => navigate('/admin', { replace: true })}
          className="w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}

export default AccessDeniedPage
