import { headers } from "next/headers"
import { auth } from "@/lib/auth/server"

export async function getAdminAccess() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null

  const allowedEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return {
    user,
    authorized: Boolean(user?.email && user.emailVerified && allowedEmails.includes(user.email.toLowerCase())),
  }
}

export async function getAdminUser() {
  const { authorized } = await getAdminAccess()
  return authorized
}
