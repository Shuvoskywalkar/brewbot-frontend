import { NextRequest, NextResponse } from "next/server"
import { createMaintainerSessionToken, MAINTAINER_SESSION_COOKIE, maintainerSessionCookieOptions, verifyMaintainerPasscode } from "@/lib/maintainer-auth"
import { isSameOriginRequest } from "@/lib/request-origin"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
  const body: unknown = await request.json().catch(() => null)
  const passcode = typeof body === "object" && body !== null && !Array.isArray(body) && "passcode" in body && typeof body.passcode === "string" ? body.passcode : ""
  if (!passcode || passcode.length > 1024) return NextResponse.json({ error: "Enter the maintainer passcode." }, { status: 400 })

  try {
    if (!verifyMaintainerPasscode(passcode)) return NextResponse.json({ error: "The maintainer passcode is incorrect." }, { status: 401 })
    const response = NextResponse.json({ success: true })
    response.cookies.set(MAINTAINER_SESSION_COOKIE, createMaintainerSessionToken(), maintainerSessionCookieOptions())
    return response
  } catch {
    return NextResponse.json({ error: "Maintainer access is not configured. Ask the owner to set up the maintainer passcode." }, { status: 503 })
  }
}
