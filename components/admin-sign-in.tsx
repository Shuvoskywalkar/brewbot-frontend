"use client"

import { useState, type FormEvent } from "react"
import { BrewBotLogo } from "@/components/brewbot-logo"

export function AdminSignIn() {
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setMessage("")
    const form = new FormData(event.currentTarget)
    const submittedEmail = String(form.get("email") ?? "").trim().toLowerCase()
    setEmail(submittedEmail)

    try {
      const response = await fetch("/api/admin/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: submittedEmail,
          password: String(form.get("password") ?? ""),
        }),
      })

      if (!response.ok) {
        setMessage("Sign-in failed. Check your admin email and password.")
        return
      }

      window.location.assign("/admin")
    } catch {
      setMessage("Sign-in failed. Check your admin email and password.")
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
        <p className="admin-auth-description">Sign in with an email and password stored in the admin database.</p>
        {message && <p className="admin-auth-message" role="alert">{message}</p>}
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
