import { randomInt, randomUUID } from "node:crypto"
import { and, eq, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { devices, rfidUsers, rfidWalletTopups } from "@/lib/db/schema"
import { isSameOriginRequest } from "@/lib/request-origin"
import { EPSConfigurationError, initializeEPSPayment } from "@/lib/payments/eps"

export const runtime = "nodejs"

function validDeviceId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z0-9_-]{1,64}$/.test(value)
}

function createMerchantTransactionId() {
  return `${Date.now()}${randomInt(0, 1_000_000_000).toString().padStart(9, "0")}`
}

function getPublicOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (request.headers.get("sec-fetch-site") === "same-origin" && origin) {
    try {
      const parsed = new URL(origin)
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.origin
    } catch {
      // Use the proxy host when the preview origin is opaque.
    }
  }
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host")
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", "")
  if (!host || (protocol !== "http" && protocol !== "https")) return request.nextUrl.origin
  try {
    return new URL(`${protocol}://${host}`).origin
  } catch {
    return request.nextUrl.origin
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
  const body: unknown = await request.json().catch(() => null)
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Review the top-up details and try again." }, { status: 400 })
  }
  const input = body as Record<string, unknown>
  const deviceId = input.deviceId
  const identifier = typeof input.identifier === "string" ? input.identifier.trim() : ""
  const amountPaisa = input.amountPaisa
  const idempotencyKey = input.idempotencyKey
  if (!validDeviceId(deviceId) || identifier.length < 1 || identifier.length > 80 ||
      typeof amountPaisa !== "number" || !Number.isSafeInteger(amountPaisa) ||
      ![10_000, 20_000, 50_000, 100_000].includes(amountPaisa) ||
      typeof idempotencyKey !== "string" || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
    return NextResponse.json({ error: "Choose an account and a valid top-up amount." }, { status: 400 })
  }

  try {
    const [device] = await db.select({ deviceId: devices.deviceId }).from(devices)
      .where(and(eq(devices.deviceId, deviceId), eq(devices.isActive, true))).limit(1)
    if (!device) return NextResponse.json({ error: "This kiosk is not active." }, { status: 400 })

    const normalizedIdentifier = identifier.replace(/[\s:-]/g, "")
    const [user] = await db.select({ id: rfidUsers.id, userName: rfidUsers.userName }).from(rfidUsers).where(and(
      eq(rfidUsers.deviceId, deviceId),
      eq(rfidUsers.isActive, true),
      /^[0-9a-f-]{36}$/i.test(identifier)
        ? eq(rfidUsers.id, identifier)
        : sql`lower(trim(${rfidUsers.cardId})) = ${normalizedIdentifier.toLowerCase()}`,
    )).limit(1)
    if (!user) return NextResponse.json({ error: "The active RFID account could not be found." }, { status: 404 })

    const [existing] = await db.select({
      redirectUrl: rfidWalletTopups.redirectUrl,
      rfidUserId: rfidWalletTopups.rfidUserId,
      deviceId: rfidWalletTopups.deviceId,
      amountPaisa: rfidWalletTopups.amountPaisa,
    }).from(rfidWalletTopups).where(eq(rfidWalletTopups.idempotencyKey, idempotencyKey)).limit(1)
    if (existing && (existing.rfidUserId !== user.id || existing.deviceId !== deviceId || existing.amountPaisa !== Number(amountPaisa))) {
      return NextResponse.json({ error: "This payment reference was already used for different details." }, { status: 409 })
    }
    if (existing?.redirectUrl) return NextResponse.json({ redirectUrl: existing.redirectUrl })
    if (existing) return NextResponse.json({ error: "This top-up is already being prepared. Try again shortly." }, { status: 409 })

    const merchantTransactionId = createMerchantTransactionId()
    const customerOrderId = `BREW-WALLET-${randomUUID()}`
    const resultToken = randomUUID()
    await db.insert(rfidWalletTopups).values({
      merchantTransactionId,
      customerOrderId,
      resultToken,
      rfidUserId: user.id,
      deviceId,
      userName: user.userName,
      amountPaisa: Number(amountPaisa),
      idempotencyKey,
      status: "pending",
    })

    try {
      const callback = new URL("/api/payments/eps/wallet-return", getPublicOrigin(request))
      const successUrl = new URL(callback)
      successUrl.searchParams.set("callbackOutcome", "success")
      const failUrl = new URL(callback)
      failUrl.searchParams.set("callbackOutcome", "failure")
      const cancelUrl = new URL(callback)
      cancelUrl.searchParams.set("callbackOutcome", "cancel")
      const redirectUrl = await initializeEPSPayment({
        customerOrderId,
        merchantTransactionId,
        totalAmountPaisa: Number(amountPaisa),
        successUrl: successUrl.toString(),
        failUrl: failUrl.toString(),
        cancelUrl: cancelUrl.toString(),
        customerName: user.userName,
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        customerCity: "",
        customerState: "",
        customerPostcode: "",
        productName: "BrewBot RFID Wallet Top-up",
      })
      await db.update(rfidWalletTopups).set({ redirectUrl, updatedAt: new Date() })
        .where(eq(rfidWalletTopups.merchantTransactionId, merchantTransactionId))
      return NextResponse.json({ redirectUrl })
    } catch (error) {
      await db.update(rfidWalletTopups).set({ status: "failed", updatedAt: new Date() })
        .where(eq(rfidWalletTopups.merchantTransactionId, merchantTransactionId)).catch(() => undefined)
      const configError = error instanceof EPSConfigurationError
      return NextResponse.json({ error: configError
        ? "Online payments are not configured yet. Please contact the administrator."
        : "The payment gateway could not be opened. Please try again." }, { status: configError ? 503 : 502 })
    }
  } catch {
    return NextResponse.json({ error: "Wallet top-up is temporarily unavailable." }, { status: 503 })
  }
}
