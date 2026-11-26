import { NextRequest, NextResponse } from "next/server"
import { MAINTAINER_SESSION_COOKIE, maintainerSessionCookieOptions } from "@/lib/maintainer-auth"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
  const response = NextResponse.json({ success: true })
  response.cookies.set(MAINTAINER_SESSION_COOKIE, "", { ...maintainerSessionCookieOptions(), maxAge: 0 })
  return response
}
