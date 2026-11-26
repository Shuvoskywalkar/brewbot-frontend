"use client"

import { useState } from "react"

export function AdminSignOut() {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    if (busy) return
    setBusy(true)
    try {
      await fetch("/api/admin/sign-out", { method: "POST" })
    } finally {
      window.location.assign("/admin/sign-in")
    }
  }

  return <button className="ops-role-switch" type="button" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
}
