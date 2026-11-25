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

function readText(input: Record<string, unknown>, key: string, maxLength: number) {
  const value = input[key]
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function normalizeBangladeshPhone(value: string) {
  const digits = value.replace(/\D/g, "")
  if (/^01[3-9]\d{8}$/.test(digits)) return digits
  if (/^8801[3-9]\d{8}$/.test(digits)) return `0${digits.slice(3)}`
  return null
}

function createMerchantTransactionId() {
  return `${Date.now()}${randomInt(0, 1_000_000_000).toString().padStart(9, "0")}`
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Invalid checkout origin." }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid checkout origin." }, { status: 403 })
    }
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Please review the checkout details and try again." }, { status: 400 })
  }

  const product = getBrewbotProduct(body.productId)
  const customerName = readText(body, "customerName", 100)
  const customerEmail = readText(body, "customerEmail", 254).toLowerCase()
  const customerPhone = normalizeBangladeshPhone(readText(body, "customerPhone", 32))
  const customerAddress = readText(body, "customerAddress", 200)
  const customerCity = readText(body, "customerCity", 100)
  const customerState = readText(body, "customerState", 100)
  const customerPostcode = readText(body, "customerPostcode", 20)
  const deviceId = body.deviceId === null || body.deviceId === "" ? null : body.deviceId

  if (
    !product ||
    (deviceId !== null && (typeof deviceId !== "string" || !/^[A-Z0-9_-]{1,64}$/.test(deviceId))) ||
    customerName.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
    !customerPhone ||
    customerAddress.length < 3 ||
    customerCity.length < 2 ||
    customerState.length < 2 ||
    customerPostcode.length < 2
  ) {
    return NextResponse.json({ error: "Please complete all required payment details with valid information." }, { status: 400 })
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
      { error: "Payment storage is not ready. Apply the included SQL migration before testing EPS checkout." },
      { status: 503 },
    )
  }

  try {
    const callbackUrl = new URL("/api/payments/eps/return", request.nextUrl.origin)
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
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPostcode,
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
          ? "EPS sandbox credentials are missing. Add them in project Vars to enable payments."
          : "EPS could not start this payment. Please try again.",
      },
      { status: isConfigurationError ? 503 : 502 },
    )
  }
}
