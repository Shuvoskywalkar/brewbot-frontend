"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { authClient } from "@/lib/auth/client"

export function AdminSignIn({ denied = false, verified = false }: { denied?: boolean; verified?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState("")
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
        setMessage("Sign-in failed. Check your owner account details and try again.")
        return
      }

      router.replace("/admin")
      router.refresh()
    } catch {
      setMessage("Sign-in failed. Check your owner account details and try again.")
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
        {message && (
          <p
            className={messageStatus === "success" ? "admin-auth-success" : "admin-auth-message"}
            role={messageStatus === "success" ? "status" : "alert"}
          >
            {message}
          </p>
        )}
        <form className="admin-auth-form" onSubmit={submit}>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setMessage("")
              setMessageStatus("error")
            }}
            required
          />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
          <button className="ops-button-primary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  )
}
