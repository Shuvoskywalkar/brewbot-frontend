"use client"

import { FormEvent, useState } from "react"
import { WalletCards } from "lucide-react"

type EPSCheckoutFormProps = {
  productId: string
  deviceId: string | null
  onRFIDClick: () => void
}

type InitializeResponse = {
  redirectUrl?: string
  error?: string
}

export function EPSCheckoutForm({ productId, deviceId, onRFIDClick }: EPSCheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/payments/eps/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          deviceId,
          customerName: formData.get("customerName"),
          customerEmail: formData.get("customerEmail"),
          customerPhone: formData.get("customerPhone"),
          customerAddress: formData.get("customerAddress"),
          customerCity: formData.get("customerCity"),
          customerState: formData.get("customerState"),
          customerPostcode: formData.get("customerPostcode"),
        }),
      })
      const result = await response.json() as InitializeResponse

      if (!response.ok || !result.redirectUrl) {
        setMessage(result.error ?? "We couldn't start the EPS payment. Please try again.")
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
    <form className="eps-checkout-form" onSubmit={handleSubmit}>
      <section className="eps-customer-card" aria-labelledby="eps-details-title">
        <div className="eps-details-heading">
          <h2 id="eps-details-title">Payment details</h2>
          <p>Required by EPS to start your payment.</p>
        </div>
        <div className="eps-fields">
          <label className="eps-field">
            <span>Full name</span>
            <input name="customerName" autoComplete="name" maxLength={100} required />
          </label>
          <label className="eps-field">
            <span>Email address</span>
            <input name="customerEmail" type="email" autoComplete="email" maxLength={254} required />
          </label>
          <label className="eps-field">
            <span>Bangladesh mobile number</span>
            <input name="customerPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" maxLength={24} required />
          </label>
          <label className="eps-field">
            <span>Street address</span>
            <input name="customerAddress" autoComplete="street-address" maxLength={200} required />
          </label>
          <label className="eps-field">
            <span>City</span>
            <input name="customerCity" autoComplete="address-level2" maxLength={100} required />
          </label>
          <label className="eps-field">
            <span>District / state</span>
            <input name="customerState" autoComplete="address-level1" maxLength={100} required />
          </label>
          <label className="eps-field">
            <span>Postal code</span>
            <input name="customerPostcode" autoComplete="postal-code" maxLength={20} required />
          </label>
        </div>
        <p className="eps-privacy-note">Your billing details are sent to EPS and are not stored by BrewBot.</p>
      </section>
      <footer className="checkout-payment-actions">
        <button className="checkout-rfid-button" type="button" onClick={onRFIDClick}>
          <WalletCards size={20} aria-hidden="true" /> Pay with RFID Card
        </button>
        <button className="checkout-pay-button" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Connecting to EPS…" : "Continue to EPS"}
        </button>
        {message && <p role="alert" className="checkout-message">{message}</p>}
      </footer>
    </form>
  )
}
