import { randomInt, randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { paymentAttempts } from "@/lib/db/schema"
import { getBrewbotProduct } from "@/lib/products"
import { EPSConfigurationError, initializeEPSPayment } from "@/lib/payments/eps"

export const runtime = "nodejs"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function createMerchantTransactionId() {
  return `${Date.now()}${randomInt(0, 1_000_000_000).toString().padStart(9, "0")}`
}

function getPublicRequestOrigin(request: NextRequest) {
  const browserOrigin = request.headers.get("origin")
  if (request.headers.get("sec-fetch-site") === "same-origin" && browserOrigin) {
    try {
      const parsedOrigin = new URL(browserOrigin)
      if (parsedOrigin.protocol === "https:" || parsedOrigin.protocol === "http:") {
        return parsedOrigin.origin
      }
    } catch {
      // Fall back to the proxy-provided host when the browser origin is opaque.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const host = forwardedHost || request.headers.get("host")
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(":", "")

  if (!host || (protocol !== "http" && protocol !== "https")) {
    return request.nextUrl.origin
  }

  return new URL(`${protocol}://${host}`).origin
}

function hasValidCheckoutOrigin(request: NextRequest, publicOrigin: string) {
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite === "cross-site") return false

  const origin = request.headers.get("origin")
  if (!origin || origin === "null") return true

  try {
    const parsedOrigin = new URL(origin)
    return parsedOrigin.origin === publicOrigin || fetchSite === "same-origin"
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const publicOrigin = getPublicRequestOrigin(request)
  if (!hasValidCheckoutOrigin(request, publicOrigin)) {
    return NextResponse.json({ error: "Invalid checkout origin." }, { status: 403 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Please review the checkout details and try again." }, { status: 400 })
  }

  const product = await getBrewbotProduct(body.productId)
  const deviceId = body.deviceId === null || body.deviceId === "" ? null : body.deviceId

  if (
    !product ||
    (deviceId !== null && (typeof deviceId !== "string" || !/^[A-Z0-9_-]{1,64}$/.test(deviceId)))
  ) {
    return NextResponse.json({ error: "This checkout could not be started. Please return to the menu and try again." }, { status: 400 })
  }

  let merchantTransactionId: string
  let resultToken: string
  let customerOrderId: string
  try {
    merchantTransactionId = createMerchantTransactionId()
    resultToken = randomUUID()
    customerOrderId = `BREW-${randomUUID()}`

    await db.insert(paymentAttempts).values({
      merchantTransactionId,
      customerOrderId,
      resultToken,
      productId: product.id,
      productName: product.name,
      deviceId: deviceId as string | null,
      amountPaisa: product.pricePaisa,
      status: "pending",
    })
  } catch {
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    )
  }

  try {
    const callbackUrl = new URL("/api/payments/eps/return", publicOrigin)
    const successUrl = new URL(callbackUrl)
    successUrl.searchParams.set("callbackOutcome", "success")
    const failUrl = new URL(callbackUrl)
    failUrl.searchParams.set("callbackOutcome", "failure")
    const cancelUrl = new URL(callbackUrl)
    cancelUrl.searchParams.set("callbackOutcome", "cancel")

    const redirectUrl = await initializeEPSPayment({
      customerOrderId,
      merchantTransactionId,
      totalAmountPaisa: product.pricePaisa,
      successUrl: successUrl.toString(),
      failUrl: failUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerCity: "",
      customerState: "",
      customerPostcode: "",
      productName: product.name,
    })

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    await db.update(paymentAttempts)
      .set({ status: "failed", updatedAt: new Date() })
      .where(and(eq(paymentAttempts.merchantTransactionId, merchantTransactionId), eq(paymentAttempts.status, "pending")))
      .catch(() => undefined)

    const isConfigurationError = error instanceof EPSConfigurationError
    return NextResponse.json(
      {
        error: isConfigurationError
          ? "Online payments are not configured yet. Please contact the administrator."
          : "We couldn't open the payment gateway. Please try again.",
      },
      { status: isConfigurationError ? 503 : 502 },
    )
  }
}
