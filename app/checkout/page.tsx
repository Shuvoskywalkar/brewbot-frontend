"use client"

import Image from "next/image"
import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock3, Phone, WalletCards } from "lucide-react"
import { EPSCheckoutForm } from "@/components/eps-checkout-form"
import { brewbotProducts, getBrewbotProduct } from "@/lib/products"

function CheckoutScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selected = getBrewbotProduct(searchParams.get("product"))
    ?? brewbotProducts.find((product) => product.id === "masala-tea")!
  const requestedDeviceId = searchParams.get("deviceId")
  const validDeviceId = requestedDeviceId && /^[A-Z0-9_-]{1,64}$/.test(requestedDeviceId)
    ? requestedDeviceId
    : null
  const deviceHomePath = validDeviceId ? `/${encodeURIComponent(validDeviceId)}` : "/"
  const [seconds, setSeconds] = useState(45)
  const [epsOpen, setEpsOpen] = useState(false)
  const [rfidOpen, setRfidOpen] = useState(false)

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSeconds((remaining) => {
        if (remaining <= 1) {
          window.clearInterval(timerId)
          router.replace(deviceHomePath)
          return 0
        }

        return remaining - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [router, deviceHomePath])

  return (
    <main className="checkout-compact-page">
      <header className="checkout-compact-header">
        <Link href={deviceHomePath} aria-label="Back to products"><ArrowLeft size={19} /></Link>
        <h1>Checkout</h1>
        <span className="checkout-countdown" role="timer" aria-label={`${seconds} seconds remaining`}>
          <Clock3 size={15} aria-hidden="true" /> {seconds}s
        </span>
      </header>
      <div className="checkout-compact-content">
        <section className="checkout-product-card" aria-label="Selected drink">
          <Image src={selected.image} alt={selected.name} width={76} height={76} />
          <div className="checkout-product-copy">
            <h2>{selected.name}</h2>
            <p>{(selected.pricePaisa / 100).toFixed(2)} Tk</p>
          </div>
          <strong className="checkout-product-price">
            {(selected.pricePaisa / 100).toLocaleString("en-BD", { maximumFractionDigits: 2 })} Tk
          </strong>
        </section>
        <section className="checkout-total-card" aria-label="Order total">
          <strong>Total Amount</strong>
          <b>{(selected.pricePaisa / 100).toLocaleString("en-BD", { maximumFractionDigits: 2 })} Tk</b>
        </section>
        {epsOpen ? (
          <EPSCheckoutForm
            productId={selected.id}
            deviceId={validDeviceId}
            onBack={() => setEpsOpen(false)}
          />
        ) : (
          <footer className="checkout-payment-actions">
            <button className="checkout-rfid-button" type="button" onClick={() => setRfidOpen(true)}>
              <WalletCards size={18} aria-hidden="true" /> Pay with RFID Card
            </button>
            <button className="checkout-pay-button" type="button" onClick={() => setEpsOpen(true)}>
              Pay Now
            </button>
          </footer>
        )}
      </div>
      {rfidOpen && (
        <div className="kiosk-overlay" role="presentation" onClick={() => setRfidOpen(false)}>
          <section className="kiosk-modal checkout-rfid-modal" role="dialog" aria-modal="true" aria-labelledby="rfid-title" onClick={(event) => event.stopPropagation()}>
            <button className="kiosk-modal-close" onClick={() => setRfidOpen(false)} aria-label="Close">×</button>
            <WalletCards size={28} />
            <h2 id="rfid-title">Get your free RFID subscription</h2>
            <p><strong className="rfid-instruction-highlight">Hold your RFID card in front of the machine&apos;s card reader.</strong> Wait up to 60 seconds for your order to dispense. <strong>No card?</strong> Bring your university ID or contact the hall machine coordinator.</p>
            <address className="checkout-rfid-contact">
              <strong>Bruce Wayne</strong>
              <span>221B Baker Street, Jagannath Hall</span>
              <a href="tel:+8801700000221"><Phone size={15} aria-hidden="true" /> +880 1700-000-221</a>
            </address>
            <button className="kiosk-checkout-link" onClick={() => setRfidOpen(false)}>Got it</button>
          </section>
        </div>
      )}
    </main>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={<main className="checkout-compact-page" />}><CheckoutScreen /></Suspense>
}
