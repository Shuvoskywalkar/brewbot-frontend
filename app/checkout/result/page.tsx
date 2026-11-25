import Link from "next/link"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { paymentAttempts } from "@/lib/db/schema"

const resultReferencePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const deviceIdPattern = /^[A-Z0-9_-]{1,64}$/

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>
}) {
  const query = await searchParams
  const reference = typeof query.ref === "string" ? query.ref : ""
  let attempt: {
    status: "pending" | "paid" | "failed" | "cancelled"
    productName: string
    amountPaisa: number
    deviceId: string | null
  } | null = null
  let storageReady = true

  if (resultReferencePattern.test(reference)) {
    try {
      const [storedAttempt] = await db.select({
        status: paymentAttempts.status,
        productName: paymentAttempts.productName,
        amountPaisa: paymentAttempts.amountPaisa,
        deviceId: paymentAttempts.deviceId,
      })
        .from(paymentAttempts)
        .where(eq(paymentAttempts.resultToken, reference))
        .limit(1)

      attempt = storedAttempt ?? null
    } catch {
      storageReady = false
    }
  }

  const title = attempt?.status === "paid"
    ? "Payment confirmed"
    : attempt?.status === "pending"
      ? "Payment is being checked"
      : attempt
        ? "Payment not completed"
        : "Payment status unavailable"
  const message = attempt?.status === "paid"
    ? "EPS verified your payment. Keep this screen as your confirmation."
    : attempt?.status === "pending"
      ? "EPS has not confirmed this transaction yet. Please wait before starting another payment."
      : attempt
        ? "EPS did not confirm this payment. You can return to the menu and try again."
        : storageReady
          ? "We could not find a verified payment for this reference."
          : "Payment confirmation is temporarily unavailable. Please check again shortly."
  const homePath = attempt?.deviceId && deviceIdPattern.test(attempt.deviceId)
    ? `/${encodeURIComponent(attempt.deviceId)}`
    : "/"

  return (
    <main className="checkout-result-page">
      <section className={`checkout-result-card checkout-result-${attempt?.status ?? "unknown"}`} aria-labelledby="checkout-result-title">
        <p className="checkout-result-eyebrow">BrewBot checkout</p>
        <h1 id="checkout-result-title">{title}</h1>
        <p className="checkout-result-message">{message}</p>
        {attempt && (
          <div className="checkout-result-order">
            <span>{attempt.productName}</span>
            <strong>{(attempt.amountPaisa / 100).toFixed(2)} Tk</strong>
          </div>
        )}
        {!storageReady && <p className="checkout-result-note">Payment storage setup is still pending.</p>}
        <Link className="checkout-result-link" href={homePath}>Return to menu</Link>
      </section>
    </main>
  )
}
