"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { authClient } from "@/lib/auth/client"

export function AdminSignIn({ denied = false }: { denied?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(denied ? "This account is not authorized for the owner workspace." : "")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setMessage("")
    const form = new FormData(event.currentTarget)

    try {
      const result = await authClient.signIn.email({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      })

      if (result.error) {
        setMessage("Sign-in failed. Check your owner account details and try again.")
        setBusy(false)
        return
      }

      router.replace("/admin")
      router.refresh()
    } catch {
      setMessage("Sign-in failed. Check your owner account details and try again.")
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
        {message && <p className="admin-auth-message" role="alert">{message}</p>}
        <form className="admin-auth-form" onSubmit={submit}>
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" name="email" type="email" autoComplete="username" required />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
          <button className="ops-button-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
    </main>
  )
}
