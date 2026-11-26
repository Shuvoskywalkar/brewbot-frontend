"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import useSWR from "swr"
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
import type { BrewbotCampaign } from "@/lib/campaigns"
import type { BrewbotProduct } from "@/lib/products"

type OwnerSection = "Overview" | "Orders" | "Products" | "Advertisements"
type Order = { id: string; time: string; item: string; payment: string; total: string; status: string }
type AdminOrder = {
  id: string
  createdAt: string
  productName: string
  status: string
  amountPaisa: number
  paymentReference: string | null
  deviceId: string | null
  locationName: string | null
}
type ActiveDevice = { deviceId: string; universityName: string; locationName: string }
type AdminDashboardResponse = {
  devices: ActiveDevice[]
  orders: AdminOrder[]
  ordersToday: number
  paidTotalPaisa: number
}

const navigation: { label: OwnerSection; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Orders", icon: ClipboardList },
  { label: "Products", icon: Package },
  { label: "Advertisements", icon: Megaphone },
]

async function fetchAdminDashboard(url: string): Promise<AdminDashboardResponse> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) throw new Error("Live admin data could not be loaded.")
  return response.json() as Promise<AdminDashboardResponse>
}

function toOrderRow(order: AdminOrder): Order {
  return {
    id: order.id,
    time: new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)),
    item: order.productName,
    payment: "EPS",
    total: `Tk ${(order.amountPaisa / 100).toFixed(2)}`,
    status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
  }
}

export function OwnerAdmin({ initialProducts, initialCampaign }: { initialProducts: BrewbotProduct[]; initialCampaign: BrewbotCampaign | null }) {
  const [section, setSection] = useState<OwnerSection>("Overview")
  const [feedback, setFeedback] = useState("")
  const { data: dashboard, error: dashboardError } = useSWR<AdminDashboardResponse>("/api/admin/dashboard", fetchAdminDashboard, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })

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
                ? "Campaigns save to Neon and appear on every storefront within seconds."
                : "Order and device summaries are not yet connected to live operational data."}
          </div>
          {feedback && <p className="ops-feedback" role="status">{feedback}</p>}

          {section === "Overview" && <Overview dashboard={dashboard} error={dashboardError?.message} onOpenOrders={() => setSection("Orders")} />}
          {section === "Orders" && <OrderRecords dashboard={dashboard} error={dashboardError?.message} />}
          {section === "Products" && <ProductManager initialProducts={initialProducts} />}
          {section === "Advertisements" && (
            <AdvertisementEditor initialCampaign={initialCampaign} onFeedback={setFeedback} />
          )}
        </div>
      </section>
    </main>
  )
}

function Overview({ dashboard, error, onOpenOrders }: { dashboard?: AdminDashboardResponse; error?: string; onOpenOrders: () => void }) {
  const primaryDevice = dashboard?.devices[0]
  const recentOrders = (dashboard?.orders ?? []).slice(0, 3).map(toOrderRow)

  return (
    <>
      {error && <p className="ops-error" role="alert">{error}</p>}
      <div className="ops-stat-grid" aria-label="Order summary">
        <SummaryCard label="Devices online" value={dashboard ? String(dashboard.devices.length) : "—"} detail={dashboard ? "Active registered kiosks" : "Loading device data…"} />
        <SummaryCard label="Orders today" value={dashboard ? String(dashboard.ordersToday) : "—"} detail={dashboard ? "Payment attempts today" : "Loading order data…"} />
        <SummaryCard label="Paid today" value={dashboard ? `Tk ${(dashboard.paidTotalPaisa / 100).toFixed(2)}` : "—"} detail={dashboard ? "Confirmed payments" : "Loading payment data…"} />
      </div>

      <section className="ops-card ops-device-card" aria-labelledby="device-summary-heading">
        <div className="ops-card-heading">
          <div><p className="ops-eyebrow">DEVICE SUMMARY</p><h2 id="device-summary-heading">Registered kiosks</h2></div>
          <span className="ops-status">{dashboard ? `${dashboard.devices.length} active` : "Loading…"}</span>
        </div>
        {primaryDevice ? (
          <div className="ops-device-details">
            <span className="ops-device-icon"><Store aria-hidden="true" /></span>
            <div><strong>{primaryDevice.locationName}</strong><span>{primaryDevice.universityName}</span></div>
            <code>{primaryDevice.deviceId}</code>
          </div>
        ) : <p className="ops-empty">{dashboard ? "No active kiosks are registered." : "Loading registered devices…"}</p>}
      </section>

      <section className="ops-card ops-orders-card" aria-labelledby="recent-orders-heading">
        <div className="ops-card-heading">
          <div><p className="ops-eyebrow">ORDER RECORDS</p><h2 id="recent-orders-heading">Recent orders</h2></div>
          <button className="ops-text-button" type="button" onClick={onOpenOrders}>View all <ArrowRight aria-hidden="true" /></button>
        </div>
        <OrderTable rows={recentOrders} emptyMessage={dashboard ? "No order records are available." : "Loading recent orders…"} />
      </section>
    </>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="ops-stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function OrderRecords({ dashboard, error }: { dashboard?: AdminDashboardResponse; error?: string }) {
  const orders = (dashboard?.orders ?? []).map(toOrderRow)

  return (
    <section className="ops-card ops-records-card" aria-labelledby="order-records-heading">
      <div className="ops-card-heading">
        <div><p className="ops-eyebrow">ORDER HISTORY</p><h2 id="order-records-heading">Recent records</h2></div>
        <span className="ops-record-count">{dashboard ? `${orders.length}${orders.length === 100 ? "+" : ""} records` : "Loading…"}</span>
      </div>
      {error && <p className="ops-error" role="alert">{error}</p>}
      <OrderTable rows={orders} emptyMessage={dashboard ? "No order records are available." : "Loading order history…"} />
    </section>
  )
}

function OrderTable({ rows, emptyMessage }: { rows: Order[]; emptyMessage: string }) {
  return (
    <div className="ops-table-scroll">
      <table className="ops-table">
        <thead><tr><th scope="col">ORDER</th><th scope="col">TIME</th><th scope="col">ITEM</th><th scope="col">PAYMENT</th><th scope="col">TOTAL</th><th scope="col">STATUS</th></tr></thead>
        <tbody>{rows.length === 0 ? (
          <tr><td className="ops-empty-table" colSpan={6}>{emptyMessage}</td></tr>
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

type CampaignResponse = { campaign: BrewbotCampaign | null }

async function fetchCampaign(url: string): Promise<CampaignResponse> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) throw new Error("Campaign details could not be loaded.")
  return response.json() as Promise<CampaignResponse>
}

function readImagePreview(file: File, onRead: (image: string) => void, onError: (message: string) => void) {
  const supportedTypes = ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]
  if (!supportedTypes.includes(file.type.toLowerCase()) || file.size > 4 * 1024 * 1024) {
    onError("Choose a supported image smaller than 4 MB.")
    return false
  }

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === "string") onRead(reader.result)
    else onError("This image could not be read.")
  }
  reader.onerror = () => onError("This image could not be read.")
  reader.readAsDataURL(file)
  return true
}

function AdvertisementEditor({
  initialCampaign,
  onFeedback,
}: {
  initialCampaign: BrewbotCampaign | null
  onFeedback: (message: string) => void
}) {
  const { data, error, isLoading, mutate } = useSWR<CampaignResponse>("/api/admin/campaign", fetchCampaign, {
    fallbackData: { campaign: initialCampaign },
    refreshInterval: 10000,
    revalidateOnFocus: true,
  })
  const [headline, setHeadline] = useState(initialCampaign?.headline ?? "")
  const [campaignCopy, setCampaignCopy] = useState(initialCampaign?.supportingText ?? "")
  const [artworkUrl, setArtworkUrl] = useState(initialCampaign?.artworkUrl ?? "")
  const [campaignImage, setCampaignImage] = useState(initialCampaign?.artworkUrl ?? "")
  const [pendingArtwork, setPendingArtwork] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (isDirty) return
    const campaign = data?.campaign
    setHeadline(campaign?.headline ?? "")
    setCampaignCopy(campaign?.supportingText ?? "")
    setArtworkUrl(campaign?.artworkUrl ?? "")
    setCampaignImage(campaign?.artworkUrl ?? "")
    setPendingArtwork(null)
  }, [data?.campaign, isDirty])

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    onFeedback("")

    const formData = new FormData()
    formData.set("headline", headline)
    formData.set("supportingText", campaignCopy)
    formData.set("artworkUrl", artworkUrl)
    if (pendingArtwork) formData.set("artwork", pendingArtwork)

    try {
      const response = await fetch("/api/admin/campaign", { method: "PUT", body: formData })
      const result = await response.json() as { campaign?: BrewbotCampaign; error?: string; warning?: string | null }
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Campaign could not be saved.")
      setArtworkUrl(result.campaign.artworkUrl ?? "")
      setCampaignImage(result.campaign.artworkUrl ?? "")
      setPendingArtwork(null)
      await mutate({ campaign: result.campaign }, false)
      setIsDirty(false)
      onFeedback(result.warning ?? "Campaign saved. Storefronts refresh the live content within seconds.")
    } catch (saveError) {
      onFeedback(saveError instanceof Error ? saveError.message : "Campaign could not be saved.")
    } finally {
      setBusy(false)
    }
  }

  function selectArtwork(file?: File) {
    if (!file) return
    if (readImagePreview(file, setCampaignImage, onFeedback)) {
      setPendingArtwork(file)
      setIsDirty(true)
      onFeedback("")
    }
  }

  function removeArtwork() {
    setPendingArtwork(null)
    setArtworkUrl("")
    setCampaignImage("")
    setIsDirty(true)
    onFeedback("")
  }

  return (
    <section className="ops-card ops-ad-editor" aria-labelledby="advertisement-heading">
      <div className="ops-card-heading">
        <div><p className="ops-eyebrow">CUSTOMER-FACING CONTENT</p><h2 id="advertisement-heading">Advertisement</h2><p>Edit the campaign message shown beside the menu and save it to publish across kiosks.</p></div>
      </div>
      {error && <p className="ops-error" role="alert">{error.message}</p>}
      {isLoading && <p className="ops-empty">Loading the live campaign…</p>}
      <div className="ops-ad-layout">
        <form className="ops-ad-form" onSubmit={saveCampaign}>
          <label htmlFor="campaign-headline">Headline</label>
          <input id="campaign-headline" value={headline} maxLength={100} onChange={(event) => { setHeadline(event.target.value); setIsDirty(true) }} required />
          <label htmlFor="campaign-copy">Supporting text</label>
          <textarea id="campaign-copy" rows={4} maxLength={400} value={campaignCopy} onChange={(event) => { setCampaignCopy(event.target.value); setIsDirty(true) }} />
          <label htmlFor="campaign-artwork">Campaign artwork</label>
          <input id="campaign-artwork" type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/webp" onChange={(event) => selectArtwork(event.target.files?.[0])} />
          <small className="ops-file-help">Images are stored in public campaign storage and shown on the kiosk storefront. Maximum size: 4 MB.</small>
          {campaignImage && <button className="ops-button-quiet" type="button" onClick={removeArtwork}>Remove artwork</button>}
          <button className="ops-button-primary" type="submit" disabled={busy}><Megaphone aria-hidden="true" /> {busy ? "Saving…" : "Save campaign"}</button>
        </form>
        <div className="ops-ad-preview">
          <span className="ops-eyebrow">CUSTOMER VIEW</span>
          <div className="ops-ad-image">{campaignImage ? <Image src={campaignImage} alt="Campaign artwork preview" fill sizes="(max-width: 700px) 100vw, 380px" unoptimized /> : <p className="ops-empty">No campaign artwork selected.</p>}</div>
          <strong>{headline || "No active campaign"}</strong>
          <p>{campaignCopy || "Add campaign copy to prepare a new advertisement."}</p>
          <small className="ops-file-help">{data?.campaign ? "Currently published on the storefront." : "Save to publish this campaign."}</small>
        </div>
      </div>
    </section>
  )
}
