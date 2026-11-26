import { auth } from "@/lib/auth/server"

export async function getAdminAccess() {
  const { data } = await auth.getSession()
  const user = data?.user ?? null
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
