"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Package,
  Store,
} from "lucide-react"
import { AdminSignOut } from "@/components/admin-sign-out"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { ProductManager } from "@/components/product-manager"
import { DEFAULT_DEVICE_ID, DEFAULT_DEVICE_PATH } from "@/lib/device-routes"
import type { BrewbotProduct } from "@/lib/products"

type OwnerSection = "Overview" | "Orders" | "Products" | "Advertisements"
type Order = { id: string; time: string; item: string; payment: string; total: string; status: string }

const navigation: { label: OwnerSection; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ClipboardList },
  { label: "Products", icon: Package },
  { label: "Advertisements", icon: Megaphone },
]

const orders: Order[] = []

export function OwnerAdmin({ initialProducts }: { initialProducts: BrewbotProduct[] }) {
  const [section, setSection] = useState<OwnerSection>("Overview")
  const [headline, setHeadline] = useState("")
  const [campaignCopy, setCampaignCopy] = useState("")
  const [campaignImage, setCampaignImage] = useState("")
  const [feedback, setFeedback] = useState("")

  return (
    <main className="ops-shell">
      <aside className="ops-sidebar">
        <Link className="ops-brand" href={DEFAULT_DEVICE_PATH} aria-label="BrewBot storefront">
          <BrewBotLogo />
        </Link>
        <div className="ops-workspace">
          <span className="ops-workspace-mark"><Store aria-hidden="true" /></span>
          <span><strong>University of Dhaka</strong><small>Owner workspace</small></span>
        </div>
        <nav className="ops-nav" aria-label="Owner workspace">
          <p className="ops-nav-label">MANAGE</p>
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={`ops-nav-item${section === label ? " is-active" : ""}`}
              type="button"
              key={label}
              aria-pressed={section === label}
              onClick={() => { setSection(label); setFeedback("") }}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="ops-sidebar-bottom">
          <Link className="ops-role-link" href="/admin/maintainer">
            <span><strong>Device maintainer</strong><small>RFID & machine care</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div className="ops-breadcrumb"><span>Owner workspace</span><b aria-hidden="true">/</b>{section}</div>
          <div className="ops-top-actions">
            <Link className="ops-role-switch" href="/admin/maintainer" aria-label="Switch to device maintainer"><span>Maintainer</span><ArrowRight aria-hidden="true" /></Link>
            <AdminSignOut />
          </div>
        </header>
        <div className="ops-content">
          <div className="ops-page-heading">
            <div>
              <p className="ops-eyebrow">BREWBOT · UNIVERSITY OF DHAKA</p>
              <h1>{section === "Overview" ? "Owner overview" : section}</h1>
              <p>Manage kiosk activity and the content customers see.</p>
            </div>
            <Link className="ops-storefront-link" href={DEFAULT_DEVICE_PATH}>View storefront <ArrowRight aria-hidden="true" /></Link>
          </div>

          <div className="ops-preview-note" role="note">
            <span className="ops-note-dot" aria-hidden="true" />
            {section === "Products"
              ? "The product catalog is connected to Neon. Saved changes appear on storefronts within seconds."
              : section === "Advertisements"
                ? "Advertisement content is still session-only; it is not yet connected to the live catalog."
                : "Order and device summaries are not yet connected to live operational data."}
          </div>
          {feedback && <p className="ops-feedback" role="status">{feedback}</p>}

          {section === "Overview" && <Overview onOpenOrders={() => setSection("Orders")} />}
          {section === "Orders" && <OrderRecords />}
          {section === "Products" && <ProductManager initialProducts={initialProducts} />}
          {section === "Advertisements" && (
            <AdvertisementEditor
              headline={headline}
              campaignCopy={campaignCopy}
              campaignImage={campaignImage}
              setHeadline={setHeadline}
              setCampaignCopy={setCampaignCopy}
              setCampaignImage={setCampaignImage}
              onImageError={setFeedback}
              onSave={() => setFeedback("Campaign changes are temporary in this session.")}
            />
          )}
        </div>
      </section>
    </main>
  )
}

function Overview({ onOpenOrders }: { onOpenOrders: () => void }) {
  return (
    <>
      <div className="ops-stat-grid" aria-label="Order summary">
        <SummaryCard label="Devices online" value="—" detail="Device status unavailable" />
        <SummaryCard label="Orders today" value="—" detail="No order data available" />
        <SummaryCard label="Order total" value="—" detail="No order data available" />
      </div>

      <section className="ops-card ops-device-card" aria-labelledby="device-summary-heading">
        <div className="ops-card-heading">
          <div><p className="ops-eyebrow">DEVICE SUMMARY</p><h2 id="device-summary-heading">Your kiosk</h2></div>
          <span className="ops-status">Status unavailable</span>
        </div>
        <div className="ops-device-details">
          <span className="ops-device-icon"><Store aria-hidden="true" /></span>
          <div><strong>Jagannath Hall</strong><span>University of Dhaka · Main entrance</span></div>
          <code>{DEFAULT_DEVICE_ID}</code>
        </div>
      </section>

      <section className="ops-card ops-orders-card" aria-labelledby="recent-orders-heading">
        <div className="ops-card-heading">
          <div><p className="ops-eyebrow">ORDER RECORDS</p><h2 id="recent-orders-heading">Recent orders</h2></div>
          <button className="ops-text-button" type="button" onClick={onOpenOrders}>View all <ArrowRight aria-hidden="true" /></button>
        </div>
        <OrderTable rows={orders.slice(0, 3)} />
      </section>
    </>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="ops-stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function OrderRecords() {
  return (
    <section className="ops-card ops-records-card" aria-labelledby="order-records-heading">
      <div className="ops-card-heading">
        <div><p className="ops-eyebrow">ORDER HISTORY</p><h2 id="order-records-heading">Recent records</h2></div>
        <span className="ops-record-count">{orders.length} records</span>
      </div>
      <OrderTable rows={orders} />
    </section>
  )
}

function OrderTable({ rows }: { rows: typeof orders }) {
  return (
    <div className="ops-table-scroll">
      <table className="ops-table">
        <thead><tr><th scope="col">ORDER</th><th scope="col">TIME</th><th scope="col">ITEM</th><th scope="col">PAYMENT</th><th scope="col">TOTAL</th><th scope="col">STATUS</th></tr></thead>
        <tbody>{rows.length === 0 ? (
          <tr><td className="ops-empty-table" colSpan={6}>No order records are available.</td></tr>
        ) : rows.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td><td>{order.time}</td><td>{order.item}</td><td>{order.payment}</td><td>{order.total}</td>
            <td><span className="ops-order-status">{order.status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function readImagePreview(file: File, onRead: (image: string) => void, onError: (message: string) => void) {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    onError("Choose an image smaller than 5 MB.")
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === "string") onRead(reader.result)
    else onError("This image could not be read.")
  }
  reader.onerror = () => onError("This image could not be read.")
  reader.readAsDataURL(file)
}

function AdvertisementEditor({
  headline,
  campaignCopy,
  campaignImage,
  setHeadline,
  setCampaignCopy,
  setCampaignImage,
  onImageError,
  onSave,
}: {
  headline: string
  campaignCopy: string
  campaignImage: string
  setHeadline: (value: string) => void
  setCampaignCopy: (value: string) => void
  setCampaignImage: (value: string) => void
  onImageError: (message: string) => void
  onSave: () => void
}) {
  return (
    <section className="ops-card ops-ad-editor" aria-labelledby="advertisement-heading">
      <div className="ops-card-heading">
        <div><p className="ops-eyebrow">CUSTOMER-FACING CONTENT</p><h2 id="advertisement-heading">Advertisement</h2><p>Edit the campaign message shown beside the menu.</p></div>
      </div>
      <div className="ops-ad-layout">
        <form className="ops-ad-form" onSubmit={(event) => { event.preventDefault(); onSave() }}>
          <label htmlFor="campaign-headline">Headline</label>
          <input id="campaign-headline" value={headline} onChange={(event) => setHeadline(event.target.value)} required />
          <label htmlFor="campaign-copy">Supporting text</label>
          <textarea id="campaign-copy" rows={4} value={campaignCopy} onChange={(event) => setCampaignCopy(event.target.value)} required />
          <label htmlFor="campaign-artwork">Campaign artwork</label>
          <input id="campaign-artwork" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImagePreview(file, (image) => { setCampaignImage(image); onImageError("") }, onImageError) }} />
          <small className="ops-file-help">Uploaded artwork is not saved after leaving this page.</small>
          <button className="ops-button-primary" type="submit"><Megaphone aria-hidden="true" /> Save campaign</button>
        </form>
        <div className="ops-ad-preview">
          <span className="ops-eyebrow">CUSTOMER VIEW</span>
          <div className="ops-ad-image">{campaignImage ? <Image src={campaignImage} alt="Campaign artwork" fill sizes="(max-width: 700px) 100vw, 380px" unoptimized /> : <p className="ops-empty">No campaign artwork selected.</p>}</div>
          <strong>{headline || "No active campaign"}</strong>
          <p>{campaignCopy || "Add campaign copy to prepare a new advertisement."}</p>
        </div>
      </div>
    </section>
  )
}
