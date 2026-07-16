import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { twoFactorService } from '@/services/twoFactorService'
import { ShieldCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { auditService } from '@/services/auditService'
import { logger } from '@/utils/logger'

const Admin2FASetupPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')

  const handleStartSetup = async () => {
    if (!user) return
    try {
      setLoading(true)
      const setupData = await twoFactorService.generateSecret(user.uid)
      setQrCodeUrl(setupData.qrCodeUrl)
      setSecret(setupData.secret)
    } catch (err: any) {
      logger.error('Failed to generate 2FA secret:', err)
      toast.error('Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !secret || verificationCode.length !== 6) return

    try {
      setLoading(true)
      const isValid = await twoFactorService.verifyCode(user.uid, verificationCode, secret)
      
      if (!isValid) {
        toast.error('Invalid verification code')
        return
      }

      // Mark 2FA as enabled in admins document and set base secret
      await twoFactorService.enable2FA(user.uid, secret)
      await updateDoc(doc(db, 'admins', user.uid), {
        twoFactorEnabled: true
      })

      await auditService.log({
        action: '2fa_enabled',
        actorUid: user.uid
      })

      toast.success('Two-Factor Authentication Enabled')
      navigate('/admin', { replace: true })
    } catch (err) {
      logger.error('Failed to verify 2FA code:', err)
      toast.error('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2 font-syne">Mandatory Security Setup</h1>
        
        <p className="text-slate-400 mb-8">
          Administrative accounts require Two-Factor Authentication (2FA) to access the dashboard.
        </p>

        {!qrCodeUrl ? (
          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Begin Setup'}
          </button>
        ) : (
          <div className="space-y-6 text-left">
            <div className="bg-white p-4 rounded-xl inline-block mx-auto w-full flex justify-center">
              {/* Note: The service generates a data URL for the QR code natively */}
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Manual Setup Key:</p>
              <code className="text-brand-400 break-all select-all">{secret}</code>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-brand-500 outline-none text-center tracking-widest text-lg font-mono"
                  placeholder="000000"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enable'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin2FASetupPage
