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
  Pencil,
  Store,
} from "lucide-react"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { DEFAULT_DEVICE_PATH } from "@/lib/device-routes"

type OwnerSection = "Overview" | "Orders" | "Products" | "Advertisements"
type Product = { id: string; name: string; price: string; stock: number; image: string }

const navigation: { label: OwnerSection; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ClipboardList },
  { label: "Products", icon: Package },
  { label: "Advertisements", icon: Megaphone },
]

const initialProducts: Product[] = [
  { id: "coffee", name: "Coffee", price: "20", stock: 42, image: "/coffee-cup.png" },
  { id: "masala-tea", name: "Masala Tea", price: "10", stock: 42, image: "/tea-cup.png" },
  { id: "milk-tea", name: "Milk Tea", price: "15", stock: 38, image: "/milk-tea-cup.png" },
]

const orders = [
  { id: "BB-2401", time: "09:42 AM", item: "Coffee", payment: "Card", total: "Tk 20.00", status: "Complete" },
  { id: "BB-2400", time: "09:35 AM", item: "Masala Tea", payment: "RFID", total: "Tk 10.00", status: "Complete" },
  { id: "BB-2399", time: "09:18 AM", item: "Milk Tea", payment: "Card", total: "Tk 15.00", status: "Complete" },
  { id: "BB-2398", time: "08:56 AM", item: "Coffee", payment: "RFID", total: "Tk 20.00", status: "Complete" },
]

export function OwnerAdmin() {
  const [section, setSection] = useState<OwnerSection>("Overview")
  const [products, setProducts] = useState(initialProducts)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [headline, setHeadline] = useState("BLACK LIVES MATTER")
  const [campaignCopy, setCampaignCopy] = useState("Current campaign banner displayed on the kiosk.")
  const [campaignImage, setCampaignImage] = useState("/blm-ad-banner.png")
  const [feedback, setFeedback] = useState("")

  function saveProduct() {
    setEditingProduct(null)
    setFeedback("Product changes are shown in this preview only.")
  }

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
          <p>Preview workspace · not connected to live records</p>
        </div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div className="ops-breadcrumb"><span>Owner workspace</span><b aria-hidden="true">/</b>{section}</div>
          <div className="ops-top-actions">
            <Link className="ops-role-switch" href="/admin/maintainer" aria-label="Switch to device maintainer"><span>Maintainer</span><ArrowRight aria-hidden="true" /></Link>
            <span className="ops-preview-pill"><i aria-hidden="true" /> Preview mode</span>
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
            Preview data only. Changes are temporary until backend integration is connected.
          </div>
          {feedback && <p className="ops-feedback" role="status">{feedback}</p>}

          {section === "Overview" && <Overview onOpenOrders={() => setSection("Orders")} />}
          {section === "Orders" && <OrderRecords />}
          {section === "Products" && (
            <ProductEditor
              products={products}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              setProducts={setProducts}
              onSave={saveProduct}
            />
          )}
          {section === "Advertisements" && (
            <AdvertisementEditor
              headline={headline}
              campaignCopy={campaignCopy}
              campaignImage={campaignImage}
              setHeadline={setHeadline}
              setCampaignCopy={setCampaignCopy}
              setCampaignImage={setCampaignImage}
              onImageError={setFeedback}
              onSave={() => setFeedback("Campaign preview updated for this session only.")}
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
      <div className="ops-stat-grid" aria-label="Preview order summary">
        <SummaryCard label="Devices online" value="01" detail="1 kiosk in workspace" />
        <SummaryCard label="Orders today" value="18" detail="Sample preview count" />
        <SummaryCard label="Order total" value="Tk 2,460" detail="Sample preview amount" />
      </div>

      <section className="ops-card ops-device-card" aria-labelledby="device-summary-heading">
        <div className="ops-card-heading">
          <div><p className="ops-eyebrow">DEVICE SUMMARY</p><h2 id="device-summary-heading">Your kiosk</h2></div>
          <span className="ops-status"><i aria-hidden="true" /> Online</span>
        </div>
        <div className="ops-device-details">
          <span className="ops-device-icon"><Store aria-hidden="true" /></span>
          <div><strong>Jagannath Hall</strong><span>University of Dhaka · Main entrance</span></div>
          <code>APD260209001</code>
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
        <span className="ops-record-count">{orders.length} sample records</span>
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
        <tbody>{rows.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td><td>{order.time}</td><td>{order.item}</td><td>{order.payment}</td><td>{order.total}</td>
            <td><span className="ops-order-status">{order.status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function ProductEditor({
  products,
  editingProduct,
  setEditingProduct,
  setProducts,
  onSave,
}: {
  products: Product[]
  editingProduct: string | null
  setEditingProduct: (id: string | null) => void
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  onSave: () => void
}) {
  const [imageFeedback, setImageFeedback] = useState("")

  return (
    <section className="ops-card ops-products-card" aria-labelledby="products-heading">
      <div className="ops-card-heading">
        <div><p className="ops-eyebrow">MENU CONTENT</p><h2 id="products-heading">Products</h2><p>Update names, prices, and photos shown on the kiosk.</p></div>
      </div>
      <div className="ops-product-list">
        {products.map((product) => (
          <article className="ops-product-row" key={product.id}>
            <Image src={product.image} alt={`${product.name} product`} width={58} height={58} unoptimized />
            {editingProduct === product.id ? (
              <form className="ops-product-edit" onSubmit={(event) => { event.preventDefault(); onSave() }}>
                <label>Product name<input value={product.name} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, name: event.target.value } : item))} required /></label>
                <label>Price (Tk)<input type="number" inputMode="decimal" min="0.01" step="0.01" value={product.price} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, price: event.target.value } : item))} required /></label>
                <label className="ops-full-field">Product photo<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImagePreview(file, (image) => { setProducts((current) => current.map((item) => item.id === product.id ? { ...item, image } : item)); setImageFeedback("") }, setImageFeedback) }} /></label>
                {imageFeedback && <p className="ops-file-feedback" role="status">{imageFeedback}</p>}
                <div className="ops-edit-actions"><button className="ops-button-primary" type="submit">Save preview</button><button className="ops-button-quiet" type="button" onClick={() => setEditingProduct(null)}>Cancel</button></div>
              </form>
            ) : (
              <>
                <div className="ops-product-copy"><strong>{product.name}</strong><span>{product.stock} units in sample stock</span></div>
                <strong className="ops-product-price">Tk {product.price}</strong>
                <button className="ops-icon-action" type="button" aria-label={`Edit ${product.name}`} onClick={() => setEditingProduct(product.id)}><Pencil aria-hidden="true" /> Edit</button>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
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
          <small className="ops-file-help">Image preview is temporary and stays in this browser session.</small>
          <button className="ops-button-primary" type="submit"><Megaphone aria-hidden="true" /> Update campaign preview</button>
        </form>
        <div className="ops-ad-preview">
          <span className="ops-eyebrow">CUSTOMER VIEW PREVIEW</span>
          <div className="ops-ad-image"><Image src={campaignImage} alt="Current campaign artwork preview" fill sizes="(max-width: 700px) 100vw, 380px" unoptimized /></div>
          <strong>{headline || "Campaign headline"}</strong>
          <p>{campaignCopy || "Supporting campaign text"}</p>
        </div>
      </div>
    </section>
  )
}
