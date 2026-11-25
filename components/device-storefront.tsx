"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, MapPin, WalletCards } from "lucide-react"
import useSWR from "swr"
import { BrewBotLogo } from "@/components/brewbot-logo"
import type { BrewbotProduct } from "@/lib/products"

type ProductResponse = { products: BrewbotProduct[] }

async function fetchProducts(url: string): Promise<ProductResponse> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) throw new Error("The menu could not be loaded.")
  return response.json() as Promise<ProductResponse>
}

type DeviceStorefrontProps = {
  deviceId: string
  universityName: string
  locationName: string
  initialProducts: BrewbotProduct[]
}

export function DeviceStorefront({ deviceId, universityName, locationName, initialProducts }: DeviceStorefrontProps) {
  const router = useRouter()
  const { data, error } = useSWR<ProductResponse>("/api/products", fetchProducts, {
    fallbackData: { products: initialProducts },
    refreshInterval: 5000,
    revalidateOnFocus: true,
  })
  const products = data?.products ?? []
  const displayUniversityName = universityName.trim() === "Dhaka University" ? "University of Dhaka" : universityName
  const buy = (id: string) => router.push(`/checkout?product=${encodeURIComponent(id)}&deviceId=${encodeURIComponent(deviceId)}`)

  return (
    <main className="kiosk-screen">
      <section className="kiosk-location" aria-label="Device location">
        <div className="kiosk-location-header">
          <div className="kiosk-location-details">
            <div className="kiosk-location-title"><Building2 className="kiosk-building-icon" aria-hidden="true"/><h1>{displayUniversityName}</h1></div>
            <p className="kiosk-hall"><MapPin size={17} fill="currentColor"/> {locationName}</p>
            <p className="kiosk-last-stock">Last Stock: 24 Nov, 09:45 PM</p>
          </div>
          <div className="kiosk-brand-stack">
            <BrewBotLogo className="kiosk-brand" />
            <Link className="kiosk-wallet-fab" href={`/recharge?deviceId=${encodeURIComponent(deviceId)}`} aria-label="Open RFID wallet">
              <WalletCards aria-hidden="true" />
            </Link>
          </div>
        </div>
        <span className="kiosk-device-id">{deviceId}</span>
      </section>

      <section className="kiosk-products" aria-label="Available drinks" aria-live="polite">
        {error && <p className="kiosk-menu-message" role="status">The menu is temporarily unavailable. Please try again shortly.</p>}
        {!error && !data && <p className="kiosk-menu-message">Loading today&apos;s menu…</p>}
        {data && products.length === 0 && <p className="kiosk-menu-message">No products are currently available.</p>}
        {products.map((product) => (
          <article className="kiosk-product" key={product.id}>
            <div className="kiosk-product-image"><Image src={product.image || "/coffee-cup.png"} alt={product.name} fill sizes="64px" unoptimized /></div>
            <div className="kiosk-product-info">
              <h2>{product.name}</h2>
              <p><span>Stock: {product.stock}</span><strong>{(product.pricePaisa / 100).toFixed(2)} Tk</strong></p>
              {product.description && <small>{product.description}</small>}
            </div>
            <button className="kiosk-buy" type="button" onClick={() => buy(product.id)} disabled={product.stock <= 0} aria-label={product.stock > 0 ? `Buy ${product.name}` : `${product.name} is sold out`}>{product.stock > 0 ? "Buy" : "Sold out"}</button>
          </article>
        ))}
      </section>

      <aside className="kiosk-ad-slot" aria-label="Advertisement">
        <Image src="/blm-ad-banner.png" alt="Raised hands silhouetted against a light background" fill sizes="(max-width: 420px) 100vw, 400px" />
      </aside>

    </main>
  )
}
