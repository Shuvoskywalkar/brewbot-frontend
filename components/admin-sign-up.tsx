"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { authClient } from "@/lib/auth/client"

type SetupStep = "create" | "verify"

export function AdminSignUp() {
  const router = useRouter()
  const [step, setStep] = useState<SetupStep>("create")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [messageStatus, setMessageStatus] = useState<"error" | "success" | "">("")

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const form = new FormData(event.currentTarget)
    const nextEmail = String(form.get("email") ?? "").trim().toLowerCase()
    const password = String(form.get("password") ?? "")
    const confirmation = String(form.get("confirm-password") ?? "")

    if (password !== confirmation) {
      setMessage("Those passwords do not match.")
      setMessageStatus("error")
      return
    }

    setBusy(true)
    setMessage("")
    setMessageStatus("")

    try {
      const result = await authClient.signUp.email({
        name: "BrewBot Owner",
        email: nextEmail,
        password,
      })

      if (result.error) {
        setMessage("Could not start account setup. If you already created an account, sign in instead.")
        setMessageStatus("error")
        return
      }

      setEmail(nextEmail)
      setStep("verify")
      setMessage("A one-time verification code was sent to your email.")
      setMessageStatus("success")
    } catch {
      setMessage("Could not start account setup. Check your details and try again.")
      setMessageStatus("error")
    } finally {
      setBusy(false)
    }
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const form = new FormData(event.currentTarget)
    const otp = String(form.get("otp") ?? "").trim()
    setBusy(true)
    setMessage("")
    setMessageStatus("")

    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp })
      if (result.error) {
        setMessage("That code could not be verified. Check it and try again.")
        setMessageStatus("error")
        return
      }

      router.replace("/admin/sign-in?verified=1")
      router.refresh()
    } catch {
      setMessage("That code could not be verified. Check it and try again.")
      setMessageStatus("error")
    } finally {
      setBusy(false)
    }
  }

  async function resendCode() {
    if (busy || !email) return

    setBusy(true)
    setMessage("")
    setMessageStatus("")

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      })

      setMessage(
        result.error
          ? "Could not send a new code. Try again shortly."
          : "A new code was sent. Use the latest code in your inbox.",
      )
      setMessageStatus(result.error ? "error" : "success")
    } catch {
      setMessage("Could not send a new code. Try again shortly.")
      setMessageStatus("error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-signup-title">
        <BrewBotLogo className="admin-auth-logo" />
        <p className="ops-eyebrow">OWNER ACCESS</p>
        <h1 id="admin-signup-title">Create your BrewBot owner account</h1>
        <p className="admin-auth-description">
          Use the authorized owner email. You&apos;ll verify it before the account can sign in.
        </p>

        {message && (
          <p className={messageStatus === "success" ? "admin-auth-success" : "admin-auth-message"} role={messageStatus === "success" ? "status" : "alert"}>
            {message}
          </p>
        )}

        {step === "create" ? (
          <form className="admin-auth-form" onSubmit={createAccount}>
            <label htmlFor="admin-signup-email">Email</label>
            <input id="admin-signup-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="admin-signup-password">Password</label>
            <input id="admin-signup-password" name="password" type="password" autoComplete="new-password" minLength={12} required />
            <label htmlFor="admin-signup-confirm-password">Confirm password</label>
            <input id="admin-signup-confirm-password" name="confirm-password" type="password" autoComplete="new-password" minLength={12} required />
            <button className="ops-button-primary" type="submit" disabled={busy}>
              {busy ? "Sending code…" : "Create owner account"}
            </button>
          </form>
        ) : (
          <form className="admin-auth-form" onSubmit={verifyEmail}>
            <label htmlFor="admin-signup-otp">Verification code</label>
            <input
              id="admin-signup-otp"
              className="admin-auth-code"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              aria-describedby="admin-signup-code-help"
              required
            />
            <p id="admin-signup-code-help" className="admin-auth-description">
              Enter the 6-digit code sent to {email}.
            </p>
            <button className="ops-button-primary" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify email"}
            </button>
            <button className="admin-auth-text-button" type="button" onClick={resendCode} disabled={busy}>
              Send a new code
            </button>
          </form>
        )}

        <p className="admin-auth-alternate">
          Already have an account? <Link href="/admin/sign-in">Sign in</Link>
        </p>
      </section>
    </main>
  )
}
