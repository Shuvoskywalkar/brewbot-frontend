import { NextResponse } from "next/server"
import {
  adminSessionCookieOptions,
  authenticateAdmin,
  createAdminSessionToken,
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  if (!body || typeof body !== "object" || !("email" in body) || !("password" in body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  if (!email || email.length > 254 || /\s/.test(email) || !email.includes("@") || !password || password.length > 1024) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  try {
    const admin = await authenticateAdmin(email, password)
    if (!admin) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(admin.id), adminSessionCookieOptions())
    return response
  } catch {
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 })
  }
}
