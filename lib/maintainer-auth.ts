import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

export const MAINTAINER_SESSION_COOKIE = "brewbot_maintainer_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 12

function getSigningSecret() {
  const secret = process.env.MAINTAINER_SESSION_SECRET ?? process.env.BETTER_AUTH_SECRET
  if (!secret || secret.length < 32) throw new Error("A maintainer session signing secret of at least 32 characters is required.")
  return secret
}

function sign(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url")
}

export function createMaintainerSessionToken() {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000
  const payload = `maintainer.${expiresAt}`
  return `${payload}.${sign(payload)}`
}

function isValidSession(token: string) {
  const [role, expiresValue, signature, ...extra] = token.split(".")
  if (role !== "maintainer" || extra.length || !/^\d+$/.test(expiresValue ?? "")) return false
  const expiresAt = Number(expiresValue)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false

  const payload = `${role}.${expiresValue}`
  const expected = Buffer.from(sign(payload), "base64url")
  const provided = Buffer.from(signature ?? "", "base64url")
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export function maintainerSessionCookieOptions() {
  const previewFrame = process.env.NODE_ENV === "development" && Boolean(process.env.V0_RUNTIME_URL)
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || previewFrame,
    sameSite: previewFrame ? ("none" as const) : ("lax" as const),
    path: "/" as const,
    maxAge: SESSION_DURATION_SECONDS,
  }
}

export function verifyMaintainerPasscode(passcode: string) {
  const expectedPasscode = process.env.MAINTAINER_PASSCODE
  if (!expectedPasscode || expectedPasscode.length < 12) throw new Error("Maintainer passcode is not configured securely.")
  const expected = createHash("sha256").update(expectedPasscode).digest()
  const provided = createHash("sha256").update(passcode).digest()
  return timingSafeEqual(expected, provided)
}

export async function getMaintainerUser() {
  const token = (await cookies()).get(MAINTAINER_SESSION_COOKIE)?.value
  if (!token) return false
  try {
    return isValidSession(token)
  } catch {
    return false
  }
}
