"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, MapPin, WalletCards } from "lucide-react"
import { BrewBotLogo } from "@/components/brewbot-logo"

const products = [
  { id: "coffee", name: "Coffee", price: 20, image: "/coffee-cup.png" },
  { id: "masala-tea", name: "Masala Raw Tea", price: 10, image: "/tea-cup.png" },
  { id: "milk-tea", name: "Milk Tea", price: 15, image: "/milk-tea-cup.png" },
]

type DeviceStorefrontProps = {
  deviceId: string
  universityName: string
  locationName: string
}

export function DeviceStorefront({ deviceId, universityName, locationName }: DeviceStorefrontProps) {
  const router = useRouter()
  const buy = (id: string) => router.push(`/checkout?product=${encodeURIComponent(id)}&deviceId=${encodeURIComponent(deviceId)}`)

  return (
    <main className="kiosk-screen">
      <section className="kiosk-location" aria-label="Device location">
        <div className="kiosk-location-header">
          <BrewBotLogo className="kiosk-brand" />
        </div>
        <div className="kiosk-location-title"><Building2 className="kiosk-building-icon" aria-hidden="true"/><h1>{universityName}</h1></div>
        <p className="kiosk-hall"><MapPin size={17} fill="currentColor"/> {locationName}</p>
        <span className="kiosk-device-id">{deviceId}</span>
      </section>

      <section className="kiosk-products" aria-label="Available drinks">
        {products.map((product) => (
          <article className="kiosk-product" key={product.id}>
            <div className="kiosk-product-image"><Image src={product.image} alt={product.name} fill sizes="64px"/></div>
            <div className="kiosk-product-info">
              <h2>{product.name}</h2>
              <p><strong>{product.price}.00 Tk</strong></p>
            </div>
            <button className="kiosk-buy" onClick={() => buy(product.id)} aria-label={`Buy ${product.name}`}>Buy</button>
          </article>
        ))}
      </section>

      <Link className="kiosk-topup-link" href={`/recharge?deviceId=${encodeURIComponent(deviceId)}`}><WalletCards aria-hidden="true" /> Add balance to RFID</Link>

    </main>
  )
}
