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

  async function startPayment() {
    if (isSubmitting) return

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
        setMessage(result.error ?? "We couldn't open the payment gateway. Please try again.")
        setIsSubmitting(false)
        return
      }

      window.location.assign(result.redirectUrl)
    } catch {
      setMessage("The payment service could not be reached. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="checkout-payment-button-wrap">
      <button className="checkout-pay-button" type="button" onClick={startPayment} disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Opening secure payment…" : "Pay Now"}
      </button>
      {message && <p role="alert" className="checkout-message">{message}</p>}
    </div>
  )
}
