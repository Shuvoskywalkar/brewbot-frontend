"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"

export function AdminSignOut() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    if (busy) return
    setBusy(true)
    try {
      await authClient.signOut()
    } finally {
      router.replace("/admin/sign-in")
      router.refresh()
    }
  }

  return <button className="ops-role-switch" type="button" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
}
