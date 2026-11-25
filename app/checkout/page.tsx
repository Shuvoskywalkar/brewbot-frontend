"use client"

import Image from "next/image"
import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock3, Phone, WalletCards } from "lucide-react"

const products = [
  { id: "masala-tea", name: "Masala Raw Tea", price: 10, image: "/tea-cup.png" },
  { id: "milk-tea", name: "Milk Tea", price: 15, image: "/milk-tea-cup.png" },
  { id: "coffee", name: "Coffee", price: 20, image: "/coffee-cup.png" },
]

function CheckoutScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = products.some((product) => product.id === searchParams.get("product")) ? searchParams.get("product")! : "masala-tea"
  const requestedDeviceId = searchParams.get("deviceId")
  const deviceHomePath = requestedDeviceId && /^[A-Z0-9_-]{1,64}$/.test(requestedDeviceId)
    ? `/${encodeURIComponent(requestedDeviceId)}`
    : "/"
  const [seconds, setSeconds] = useState(45)
  const [message, setMessage] = useState("")
  const [rfidOpen, setRfidOpen] = useState(false)
  const selected = products.find((product) => product.id === selectedId)!

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
        <Link href={deviceHomePath} aria-label="Back to products"><ArrowLeft size={20} /></Link>
        <h1>Checkout</h1>
        <span className="checkout-countdown" role="timer" aria-label={`${seconds} seconds remaining`}><Clock3 size={16} /> {seconds}s</span>
      </header>
      <div className="checkout-compact-content">
        <section className="checkout-product-card">
          <Image src={selected.image} alt={selected.name} width={76} height={76} />
          <div className="checkout-product-copy"><h2>{selected.name}</h2><p>{selected.price}.00 Tk</p></div>
          <strong className="checkout-product-price">{selected.price} Tk</strong>
        </section>
        <div className="checkout-payment-actions">
          <button className="checkout-rfid-button" onClick={() => setRfidOpen(true)}><WalletCards size={20} /> Pay with RFID Card</button>
          <button className="checkout-pay-button" onClick={() => setMessage("Payment gateway will be connected in the backend phase.")}>Pay Now</button>
          {message && <p role="status" className="checkout-message">{message}</p>}
        </div>
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
