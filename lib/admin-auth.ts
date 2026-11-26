import { auth } from "@/lib/auth/server"

export async function getAdminAccess() {
  let user = null
  try {
    const { data } = await auth.getSession()
    user = data?.user ?? null
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified")) {
      throw error
    }
  }

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
