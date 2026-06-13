import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_PASSWORD, useStore } from '../store'
import type { User } from '../types'

type Step = 'credentials' | 'verify'

const CODE_LENGTH = 6
const RESEND_SECONDS = 30

function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const shown =
    local.length <= 2
      ? local[0]
      : `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}`
  return `${shown}@${domain}`
}

export function Login() {
  const { signIn, completeSignIn, notify } = useStore()

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('emily@shouldertap.dev')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // The challenge for the second factor. With no backend we generate the
  // one-time code in the browser and reveal it in a clearly-labeled demo banner.
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [issuedCode, setIssuedCode] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [codeError, setCodeError] = useState('')
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const boxRefs = useRef<Array<HTMLInputElement | null>>([])

  const enteredCode = digits.join('')

  function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = signIn(email, password)
    if (!result.ok) {
      setSubmitting(false)
      setError(result.error)
      return
    }
    const code = generateCode()
    setPendingUser(result.user)
    setIssuedCode(code)
    setDigits(Array(CODE_LENGTH).fill(''))
    setCodeError('')
    setResendIn(RESEND_SECONDS)
    setStep('verify')
    setSubmitting(false)
  }

  function setDigitAt(index: number, value: string) {
    const clean = value.replace(/\D/g, '')
    setCodeError('')
    if (clean.length > 1) {
      // Pasting / typing several digits at once: spread them across the boxes.
      const next = [...digits]
      for (let i = 0; i < clean.length && index + i < CODE_LENGTH; i += 1) {
        next[index + i] = clean[i]
      }
      setDigits(next)
      const last = Math.min(index + clean.length, CODE_LENGTH - 1)
      boxRefs.current[last]?.focus()
      return
    }
    const next = [...digits]
    next[index] = clean
    setDigits(next)
    if (clean && index < CODE_LENGTH - 1) boxRefs.current[index + 1]?.focus()
  }

  function handleDigitKey(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus()
    }
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (enteredCode.length < CODE_LENGTH) {
      setCodeError('Enter all six digits.')
      return
    }
    if (enteredCode !== issuedCode) {
      setCodeError('That code isn’t right. Check the digits and try again.')
      setDigits(Array(CODE_LENGTH).fill(''))
      boxRefs.current[0]?.focus()
      return
    }
    if (pendingUser) {
      completeSignIn(pendingUser.id)
      notify(`Welcome back, ${pendingUser.name.split(' ')[0]}`, 'success')
    }
  }

  function resendCode() {
    const code = generateCode()
    setIssuedCode(code)
    setDigits(Array(CODE_LENGTH).fill(''))
    setCodeError('')
    setResendIn(RESEND_SECONDS)
    boxRefs.current[0]?.focus()
    notify('A fresh code was sent', 'info')
  }

  function backToStart() {
    setStep('credentials')
    setPendingUser(null)
    setIssuedCode('')
    setDigits(Array(CODE_LENGTH).fill(''))
    setCodeError('')
    setPassword('')
  }

  // Resend countdown on the verify step.
  useEffect(() => {
    if (step !== 'verify' || resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendIn])

  // Focus the first code box when we reach the verify step.
  useEffect(() => {
    if (step === 'verify') boxRefs.current[0]?.focus()
  }, [step])

  const maskedEmail = useMemo(
    () => (pendingUser ? maskEmail(pendingUser.email) : ''),
    [pendingUser],
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true" />
          Shoulder Tap
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} noValidate>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to find the missing person for your project.</p>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="you@shouldertap.dev"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              Continue
            </button>

            <div className="auth-demo-note">
              <strong>Demo accounts.</strong> Use any seeded email (e.g.{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setEmail('emily@shouldertap.dev')
                  setPassword(DEMO_PASSWORD)
                  setError('')
                }}
              >
                emily@shouldertap.dev
              </button>
              ) with the password <code>{DEMO_PASSWORD}</code>.
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate>
            <button type="button" className="auth-back" onClick={backToStart}>
              ← Back
            </button>
            <h1 className="auth-title">Verify it’s you</h1>
            <p className="auth-sub">
              Enter the 6-digit code we sent to <strong>{maskedEmail}</strong>.
            </p>

            <div className="otp-row" onPaste={(e) => {
              const text = e.clipboardData.getData('text')
              if (/\d/.test(text)) {
                e.preventDefault()
                setDigitAt(0, text)
              }
            }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    boxRefs.current[i] = el
                  }}
                  className={`otp-box${codeError ? ' otp-error' : ''}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  value={d}
                  onChange={(e) => setDigitAt(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKey(i, e)}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {codeError && <p className="auth-error">{codeError}</p>}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={enteredCode.length < CODE_LENGTH}
            >
              Verify &amp; sign in
            </button>

            <div className="auth-resend">
              {resendIn > 0 ? (
                <span className="muted">Resend code in {resendIn}s</span>
              ) : (
                <button type="button" className="link-btn" onClick={resendCode}>
                  Resend code
                </button>
              )}
            </div>

            <div className="auth-demo-note">
              <strong>Demo two-factor.</strong> There’s no SMS or email server here, so your
              code is <code className="otp-reveal">{issuedCode}</code>.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
