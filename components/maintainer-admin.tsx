"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ArrowRight, Radio, ShieldCheck, Store, UserRoundPlus, X } from "lucide-react"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { DEFAULT_DEVICE_PATH } from "@/lib/device-routes"

type RfidMember = { id: string; userName: string; cardId: string }

const initialMembers: RfidMember[] = [
  { id: "member-1", userName: "Ayesha Rahman", cardId: "04A9-7C21" },
  { id: "member-2", userName: "Nabil Ahmed", cardId: "91C2-18F4" },
]

export function MaintainerAdmin() {
  const [members, setMembers] = useState(initialMembers)
  const [userName, setUserName] = useState("")
  const [cardId, setCardId] = useState("")
  const [pendingCancel, setPendingCancel] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")

  function registerMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedUserName = userName.trim().replace(/\s+/g, " ")
    const normalizedCardId = cardId.trim().toUpperCase()
    if (members.some((member) => member.cardId === normalizedCardId || member.userName.toLowerCase() === normalizedUserName.toLowerCase())) {
      setFeedback("That user name or RFID card is already registered in this preview.")
      return
    }
    setMembers((current) => [...current, { id: `${Date.now()}`, userName: normalizedUserName, cardId: normalizedCardId }])
    setUserName("")
    setCardId("")
    setFeedback("RFID registration added to this preview only.")
  }

  function cancelRegistration(member: RfidMember) {
    setMembers((current) => current.filter((entry) => entry.id !== member.id))
    setPendingCancel(null)
    setFeedback(`RFID access for ${member.userName} was removed from this preview.`)
  }

  return (
    <main className="ops-shell ops-maintainer-shell">
      <aside className="ops-sidebar">
        <Link className="ops-brand" href={DEFAULT_DEVICE_PATH} aria-label="BrewBot storefront"><BrewBotLogo /></Link>
        <div className="ops-workspace">
          <span className="ops-workspace-mark"><Store aria-hidden="true" /></span>
          <span><strong>Jagannath Hall</strong><small>Device workspace</small></span>
        </div>
        <div className="ops-maintainer-label"><ShieldCheck aria-hidden="true" /><span>DEVICE MAINTAINER</span></div>
        <div className="ops-sidebar-bottom">
          <Link className="ops-role-link" href="/admin">
            <span><strong>Owner workspace</strong><small>Orders, menu & ads</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <p>Preview workspace · not connected to live records</p>
        </div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar">
          <div className="ops-breadcrumb"><span>Device maintainer</span><b aria-hidden="true">/</b>RFID users</div>
          <div className="ops-top-actions">
            <Link className="ops-role-switch" href="/admin" aria-label="Switch to owner workspace"><ArrowLeft aria-hidden="true" /><span>Owner</span></Link>
            <span className="ops-preview-pill"><i aria-hidden="true" /> Preview mode</span>
          </div>
        </header>
        <div className="ops-content">
          <div className="ops-page-heading">
            <div>
              <p className="ops-eyebrow">DEVICE APD260209001</p>
              <h1>Device maintainer</h1>
              <p>Check your assigned kiosk and manage RFID access.</p>
            </div>
            <Link className="ops-storefront-link" href="/admin"><ArrowLeft aria-hidden="true" /> Owner workspace</Link>
          </div>

          <div className="ops-preview-note" role="note">
            <span className="ops-note-dot" aria-hidden="true" />
            Preview data only. Registration and cancellation are temporary until backend integration is connected.
          </div>
          {feedback && <p className="ops-feedback" role="status">{feedback}</p>}

          <section className="ops-card ops-maintainer-device" aria-labelledby="maintainer-device-heading">
            <div className="ops-card-heading">
              <div><p className="ops-eyebrow">DEVICE SUMMARY</p><h2 id="maintainer-device-heading">Jagannath Hall kiosk</h2></div>
              <span className="ops-status"><i aria-hidden="true" /> Online</span>
            </div>
            <div className="ops-device-details">
              <span className="ops-device-icon"><Radio aria-hidden="true" /></span>
              <div><strong>University of Dhaka</strong><span>Main entrance · Last sync just now</span></div>
              <code>APD260209001</code>
            </div>
          </section>

          <div className="ops-maintainer-grid">
            <section className="ops-card ops-rfid-form-card" aria-labelledby="rfid-register-heading">
              <div className="ops-card-heading">
                <div><p className="ops-eyebrow">RFID ACCESS</p><h2 id="rfid-register-heading">Register a user</h2><p>Link a person&apos;s name to one RFID card.</p></div>
                <span className="ops-form-icon"><UserRoundPlus aria-hidden="true" /></span>
              </div>
              <form className="ops-rfid-form" onSubmit={registerMember}>
                <label htmlFor="user-name">User name</label>
                <input id="user-name" value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="Enter the cardholder&apos;s name" autoComplete="name" required />
                <label htmlFor="rfid-card-id">RFID card number</label>
                <input id="rfid-card-id" value={cardId} onChange={(event) => setCardId(event.target.value)} placeholder="Scan or enter card number" autoComplete="off" required />
                <button className="ops-button-primary" type="submit"><UserRoundPlus aria-hidden="true" /> Register RFID user</button>
              </form>
            </section>

            <section className="ops-card ops-members-card" aria-labelledby="registered-users-heading">
              <div className="ops-card-heading">
                <div><p className="ops-eyebrow">CURRENT DEVICE</p><h2 id="registered-users-heading">Registered RFID users</h2></div>
                <span className="ops-record-count">{String(members.length).padStart(2, "0")} users</span>
              </div>
              <div className="ops-member-list">
                {members.length === 0 ? <p className="ops-empty">No RFID users are registered in this preview.</p> : members.map((member) => (
                  <article className="ops-member-row" key={member.id}>
                    <span className="ops-member-avatar" aria-hidden="true">{member.userName.slice(-2)}</span>
                    <div className="ops-member-copy"><strong>{member.userName}</strong><span>Card · {member.cardId}</span></div>
                    {pendingCancel === member.id ? (
                      <div className="ops-cancel-confirm" role="group" aria-label={`Confirm cancellation for ${member.userName}`}>
                        <button className="ops-cancel-confirm-button" type="button" onClick={() => cancelRegistration(member)}>Confirm</button>
                        <button className="ops-icon-action" type="button" onClick={() => setPendingCancel(null)} aria-label="Keep RFID access"><X aria-hidden="true" /></button>
                      </div>
                    ) : (
                      <button className="ops-cancel-button" type="button" onClick={() => setPendingCancel(member.id)}>Cancel access</button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
          <p className="ops-page-footnote">RFID changes are kept in browser memory for this preview only.</p>
        </div>
      </section>
    </main>
  )
}
