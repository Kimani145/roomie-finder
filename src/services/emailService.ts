import { toast } from 'react-hot-toast'

/**
 * Pluggable email delivery service for Roomie Finder.
 * In production, this can be integrated with SendGrid, Mailgun, SMTP, or Firebase Triggers.
 * In development, it logs a professionally designed HTML email template to the console
 * and alerts the developer/tester with a toast notification containing the OTP.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // HTML Template for OTP
  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Roomie Finder Verification Code</title>
  <style>
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #F8FAFC;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 580px;
      margin: 40px auto;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .header {
      background: linear-gradient(135deg, #800020 0%, #4A0012 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #FFFFFF;
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 32px;
    }
    .intro {
      font-size: 16px;
      line-height: 24px;
      color: #475569;
      margin-bottom: 24px;
    }
    .code-container {
      background: #F1F5F9;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 32px 0;
      border: 1px solid #E2E8F0;
    }
    .code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #800020;
      letter-spacing: 6px;
      margin: 0;
    }
    .expiry {
      font-size: 13px;
      color: #E11D48;
      font-weight: 600;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
      line-height: 18px;
    }
    .footer a {
      color: #800020;
      text-decoration: none;
      font-weight: 600;
    }
    .security-notice {
      margin-top: 16px;
      border-top: 1px dashed #E2E8F0;
      padding-top: 16px;
      font-size: 12px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ROOMIE FINDER</h1>
    </div>
    <div class="content">
      <p class="intro">Hello,</p>
      <p class="intro">We received a request to verify your identity. Please use the following six-digit code to complete your two-step verification process:</p>
      
      <div class="code-container">
        <div class="code">${otp}</div>
        <div class="expiry">Expires in 5 minutes</div>
      </div>
      
      <p class="intro" style="font-size: 14px; color: #64748B;">This code is valid for 5 attempts only. Once verified, it will immediately become invalid. Please do not share this code with anyone, including Roomie Finder staff.</p>
      
      <div class="security-notice">
        <strong>Didn't make this request?</strong><br>
        If you did not request this verification code, please ignore this email. Your password is still secure, but we recommend changing it if you suspect unauthorized activity.
      </div>
    </div>
    <div class="footer">
      This is an automated security notification from Roomie Finder.<br>
      Technical University of Kenya &bull; Nairobi, Kenya<br>
      <a href="https://students.tukenya.ac.ke">students.tukenya.ac.ke</a>
    </div>
  </div>
</body>
</html>
`

  // Log to Console for Developer/Testing Inspection
  console.group('%c🔑 [2FA EMAIL] Roomie Finder OTP Delivery', 'color: #800020; font-weight: bold; font-size: 14px;')
  console.log(`To: ${email}`)
  console.log(`Subject: Roomie Finder Security Verification Code: ${otp}`)
  console.log('HTML Payload Preview:')
  console.log(htmlTemplate)
  console.groupEnd()

  // Development helper toast containing the OTP for easier testing
  toast.success(`OTP Sent! Check console or use code: ${otp}`, {
    duration: 10000,
    icon: '🔑',
  })
}
