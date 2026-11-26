"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { authClient } from "@/lib/auth/client"

export function AdminSignIn({ denied = false, verified = false }: { denied?: boolean; verified?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationRequested, setVerificationRequested] = useState(false)
  const [message, setMessage] = useState(
    denied
      ? "This account is not authorized for the owner workspace."
      : verified
        ? "Email verified. Sign in with your password."
        : "",
  )
  const [messageStatus, setMessageStatus] = useState<"error" | "success">(verified ? "success" : "error")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setMessage("")
    setMessageStatus("error")
    const form = new FormData(event.currentTarget)
    const submittedEmail = String(form.get("email") ?? "").trim().toLowerCase()
    setEmail(submittedEmail)

    try {
      const result = await authClient.signIn.email({
        email: submittedEmail,
        password: String(form.get("password") ?? ""),
      })

      if (result.error) {
        setMessage("Sign-in failed. Check your owner account details. If you have not verified your email, request a new code below.")
        return
      }

      router.replace("/admin")
      router.refresh()
    } catch {
      setMessage("Sign-in failed. Check your owner account details. If you have not verified your email, request a new code below.")
    } finally {
      setBusy(false)
    }
  }

  async function requestVerificationCode(form: HTMLFormElement | null) {
    if (busy) return

    const submittedEmail = String(form ? new FormData(form).get("email") ?? "" : email).trim().toLowerCase()
    if (!submittedEmail) {
      setMessage("Enter your email address first, then request a verification code.")
      setMessageStatus("error")
      return
    }

    setEmail(submittedEmail)
    setBusy(true)
    setMessage("")

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: submittedEmail,
        type: "email-verification",
      })

      setVerificationRequested(true)
      setMessage("If this address has an unverified owner account, a code may be sent. Check your inbox and spam folder.")
      setMessageStatus("success")
    } catch {
      setVerificationRequested(true)
      setMessage("If this address has an unverified owner account, a code may be sent. Check your inbox and spam folder.")
      setMessageStatus("success")
    } finally {
      setBusy(false)
    }
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setMessage("")
    const form = new FormData(event.currentTarget)

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: String(form.get("otp") ?? "").trim(),
      })

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

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-signin-title">
        <BrewBotLogo className="admin-auth-logo" />
        <p className="ops-eyebrow">OWNER ACCESS</p>
        <h1 id="admin-signin-title">Sign in to manage BrewBot</h1>
        <p className="admin-auth-description">Use an existing owner account authorized for this workspace.</p>
        {message && <p className={messageStatus === "success" ? "admin-auth-success" : "admin-auth-message"} role={messageStatus === "success" ? "status" : "alert"}>{message}</p>}
        <form id="admin-signin-form" className="admin-auth-form" onSubmit={submit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setVerificationRequested(false)
              setVerificationCode("")
              setMessage("")
              setMessageStatus("error")
            }}
            required
          />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
          <button className="ops-button-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <button className="admin-auth-text-button" type="button" form="admin-signin-form" onClick={(event) => requestVerificationCode(event.currentTarget.form)} disabled={busy}>
          {busy ? "Please wait…" : "Resend verification code"}
        </button>
        {verificationRequested && (
          <form className="admin-auth-form" onSubmit={verifyEmail}>
            <label htmlFor="admin-signin-otp">Verification code</label>
            <input
              id="admin-signin-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              required
            />
            <button className="ops-button-primary" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify email"}</button>
          </form>
        )}
        <p className="admin-auth-alternate">New owner? <Link href="/admin/sign-up">Create an account</Link></p>
      </section>
    </main>
  )
}
