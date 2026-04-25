import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { AlertCircle, CheckCircle2, Mail, KeyRound, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        type: 'success', 
        text: 'Password reset link sent! Check your student email.' 
      });
      setEmail('');
    } catch (error: any) {
      console.error("Reset failed:", error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to send reset email. Please ensure the email is correct.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell-surface min-h-screen flex flex-col justify-center py-12 px-6 sm:px-8">
      <div className="card-surface card-surface-cello max-w-md w-full mx-auto rounded-2xl p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <KeyRound className="h-7 w-7 text-blue-500 dark:text-blue-300" />
          </div>
          <h1 className="font-syne text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your student email and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
            message.type === 'success' 
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300' 
              : 'bg-red-50/50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (message?.type === 'error') setMessage(null);
                }}
                placeholder="joseph@students.tukenya.ac.ke"
                required
                disabled={isSubmitting}
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
              />
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all mt-6 active:scale-[0.98]"
          >
            {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
