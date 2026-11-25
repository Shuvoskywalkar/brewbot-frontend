"use client"

import { useState } from "react"

type CheckoutPaymentButtonProps = {
  productId: string
  deviceId: string | null
}

type InitializeResponse = {
  redirectUrl?: string
  error?: string
}

export function CheckoutPaymentButton({ productId, deviceId }: CheckoutPaymentButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  async function startPayment() {
    if (isSubmitting || paymentUrl) return

    const gatewayWindow = window.open("about:blank", "_blank")
    if (gatewayWindow) gatewayWindow.opener = null

    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/payments/eps/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, deviceId }),
      })
      const result = await response.json() as InitializeResponse

      if (!response.ok || !result.redirectUrl) {
        gatewayWindow?.close()
        setMessage(result.error ?? "We couldn't open the payment gateway. Please try again.")
        setIsSubmitting(false)
        return
      }

      setPaymentUrl(result.redirectUrl)
      let openedInNewTab = false
      if (gatewayWindow && !gatewayWindow.closed) {
        try {
          gatewayWindow.location.replace(result.redirectUrl)
          openedInNewTab = true
        } catch {
          gatewayWindow.close()
        }
      }
      setMessage(
        openedInNewTab
          ? "EPS checkout opened in a new tab. If it didn't appear, use the link below."
          : "Your EPS checkout is ready. Open it in a new tab below.",
      )
      setIsSubmitting(false)
    } catch {
      gatewayWindow?.close()
      setMessage("The payment service could not be reached. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-payment-button-wrap">
      <button className="checkout-pay-button" type="button" onClick={startPayment} disabled={isSubmitting || Boolean(paymentUrl)} aria-busy={isSubmitting}>
        {isSubmitting ? "Preparing secure payment…" : paymentUrl ? "Payment link ready" : "Pay Now"}
      </button>
      {paymentUrl && (
        <a className="checkout-pay-button checkout-gateway-fallback" href={paymentUrl} target="_blank" rel="noopener noreferrer">
          Continue to EPS checkout
        </a>
      )}
      {message && <p role="status" className="checkout-message">{message}</p>}
    </div>
  )
}
