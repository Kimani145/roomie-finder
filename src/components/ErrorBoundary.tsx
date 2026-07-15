import React, { ErrorInfo, ReactNode } from 'react'
import { logger } from '@/utils/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ErrorBoundary] Uncaught rendering error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-syne">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 text-red-500">
              <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h1 className="text-2xl font-bold font-syne">Something went wrong</h1>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              An unexpected error occurred in this application. Try reloading the application. If the problem persists, please contact support.
            </p>

            {isDev && this.state.error && (
              <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 overflow-auto max-h-60 text-xs font-mono border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-bold text-red-600 dark:text-red-400">{this.state.error.toString()}</p>
                <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                onClick={this.handleReload}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-xl transition duration-150 shadow-md"
              >
                Reload Application
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-6 py-3 rounded-xl transition duration-150"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
