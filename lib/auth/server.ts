import { createNeonAuth } from "@neon/auth/next/server"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET ?? process.env.BETTER_AUTH_SECRET

if (!baseUrl || !cookieSecret || cookieSecret.length < 32) {
  throw new Error("Neon Auth requires NEON_AUTH_BASE_URL and a 32-character session cookie secret.")
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sameSite: process.env.NODE_ENV === "development" ? "none" : "lax",
  },
})
