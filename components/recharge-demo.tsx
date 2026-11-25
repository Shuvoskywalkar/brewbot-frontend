"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, CircleAlert, CreditCard, ShieldCheck, WalletCards } from "lucide-react"
import { BrewBotLogo } from "@/components/brewbot-logo"

type PaymentMethod = "bKash" | "Nagad" | "Bank"
type DemoAccount = { userId: string; name: string; cardId: string; balance: number }
type PaymentState = "ready" | "processing" | "success" | "failed"

const demoAccounts: DemoAccount[] = [
  { userId: "JNU-2026-0142", name: "Ayesha Rahman", cardId: "04A9-7C21", balance: 120 },
  { userId: "JNU-2026-0198", name: "Nabil Ahmed", cardId: "91C2-18F4", balance: 80 },
]
const amounts = [100, 200, 500]
const paymentMethods: { id: PaymentMethod; detail: string; className: string }[] = [
  { id: "bKash", detail: "Mobile financial service", className: "bkash" },
  { id: "Nagad", detail: "Mobile financial service", className: "nagad" },
  { id: "Bank", detail: "Online bank transfer", className: "bank" },
]

export function RechargeDemo({ backHref }: { backHref: string }) {
  const [lookup, setLookup] = useState("")
  const [account, setAccount] = useState<DemoAccount | null>(null)
  const [amount, setAmount] = useState<number | null>(200)
  const [method, setMethod] = useState<PaymentMethod>("bKash")
  const [paymentState, setPaymentState] = useState<PaymentState>("ready")
  const [transactionId, setTransactionId] = useState("")
  const [lookupError, setLookupError] = useState("")

  function findAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = lookup.trim().toUpperCase()
    const found = demoAccounts.find((entry) => entry.userId.toUpperCase() === normalized || entry.cardId.toUpperCase() === normalized)
    setLookupError(found ? "" : "No demo account matched. Try one of the sample IDs below.")
    setAccount(found ? { ...found } : null)
    setPaymentState("ready")
    setTransactionId("")
  }

  function simulatePayment(result: "success" | "failed") {
    if (!account || !amount || paymentState === "processing") return
    setPaymentState("processing")
    window.setTimeout(() => {
      if (result === "success") {
        setAccount((current) => current ? { ...current, balance: current.balance + amount } : current)
        setTransactionId(`DEMO-${Date.now().toString().slice(-8)}`)
      }
      setPaymentState(result)
    }, 650)
  }

  function startOver() {
    setAccount(null)
    setLookup("")
    setPaymentState("ready")
    setTransactionId("")
    setLookupError("")
  }

  return (
    <main className="recharge-page">
      <header className="recharge-header">
        <Link className="recharge-back" href={backHref} aria-label="Back to BrewBot kiosk"><ArrowLeft aria-hidden="true" /></Link>
        <BrewBotLogo />
        <span className="recharge-header-label">RFID WALLET</span>
      </header>

      <div className="recharge-content">
        <div className="recharge-intro">
          <span className="recharge-icon"><WalletCards aria-hidden="true" /></span>
          <p className="recharge-eyebrow">CAMPUS RFID</p>
          <h1>Add balance to your card</h1>
          <p>Top up your BrewBot wallet for quick, cashless kiosk purchases.</p>
        </div>

        <aside className="recharge-demo-notice" role="note">
          <span className="recharge-demo-mark">DEMO</span>
          <p><strong>EPS integration demo</strong><span>UI simulation only. No request goes to EPS, no payment is sent, and balances reset when you refresh.</span></p>
          <CircleAlert aria-hidden="true" />
        </aside>

        {!account ? (
          <section className="recharge-card" aria-labelledby="account-heading">
            <div className="recharge-section-heading">
              <span className="recharge-step">01</span>
              <div><h2 id="account-heading">Find your demo account</h2><p>Enter a sample student ID or RFID card number.</p></div>
            </div>
            <form className="recharge-lookup-form" onSubmit={findAccount}>
              <label htmlFor="account-lookup">Student ID or RFID card number</label>
              <input id="account-lookup" value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="e.g. JNU-2026-0142" autoComplete="off" required aria-describedby={lookupError ? "lookup-error" : "sample-account-hint"} />
              {lookupError ? <p className="recharge-error" id="lookup-error" role="alert">{lookupError}</p> : <p className="recharge-hint" id="sample-account-hint">Demo IDs: JNU-2026-0142 or JNU-2026-0198</p>}
              <button className="recharge-primary-button" type="submit">Continue <ArrowRight aria-hidden="true" /></button>
            </form>
          </section>
        ) : (
          <>
            <section className="recharge-card recharge-account-card" aria-labelledby="account-heading">
              <div className="recharge-section-heading">
                <span className="recharge-step">01</span>
                <div><h2 id="account-heading">Account found</h2><p>Demo account · not a live student record</p></div>
                <button className="recharge-text-button" type="button" onClick={startOver}>Change</button>
              </div>
              <div className="recharge-account-summary">
                <span className="recharge-avatar" aria-hidden="true">{account.name.split(" ").map((part) => part[0]).join("")}</span>
                <div><strong>{account.name}</strong><span>{account.userId} · Card {account.cardId}</span></div>
                <p><small>Current balance</small><strong>Tk {account.balance.toFixed(2)}</strong></p>
              </div>
            </section>

            <section className="recharge-card" aria-labelledby="amount-heading">
              <div className="recharge-section-heading">
                <span className="recharge-step">02</span>
                <div><h2 id="amount-heading">Choose an amount</h2><p>Demo top-ups are in Bangladeshi taka.</p></div>
              </div>
              <div className="recharge-amount-options" role="group" aria-label="Recharge amount">
                {amounts.map((value) => <button key={value} className={amount === value ? "is-selected" : ""} type="button" aria-pressed={amount === value} onClick={() => { setAmount(value); setPaymentState("ready") }}>Tk {value}</button>)}
              </div>
            </section>

            <section className="recharge-card" aria-labelledby="method-heading">
              <div className="recharge-section-heading">
                <span className="recharge-step">03</span>
                <div><h2 id="method-heading">Choose payment method</h2><p>These options simulate EPS checkout.</p></div>
              </div>
              <fieldset className="recharge-methods">
                <legend className="sr-only">Payment method</legend>
                {paymentMethods.map((item) => (
                  <label className={`recharge-method ${method === item.id ? "is-selected" : ""}`} key={item.id}>
                    <input type="radio" name="payment-method" value={item.id} checked={method === item.id} onChange={() => { setMethod(item.id); setPaymentState("ready") }} />
                    <span className={`recharge-method-mark ${item.className}`} aria-hidden="true">{item.id === "Bank" ? <CreditCard /> : item.id === "bKash" ? "b" : "N"}</span>
                    <span className="recharge-method-copy"><strong>{item.id}</strong><small>{item.detail}</small></span>
                    <span className="recharge-radio-indicator" aria-hidden="true" />
                  </label>
                ))}
              </fieldset>
            </section>

            <section className="recharge-card recharge-payment-card" aria-label="Demo payment controls">
              <div className="recharge-total"><span>Recharge amount</span><strong>Tk {amount?.toFixed(2) ?? "0.00"}</strong></div>
              {paymentState === "ready" && <div className="recharge-demo-actions"><button className="recharge-primary-button" type="button" disabled={!amount} onClick={() => simulatePayment("success")}>Simulate successful payment <ArrowRight aria-hidden="true" /></button><button className="recharge-fail-button" type="button" onClick={() => simulatePayment("failed")}>Simulate payment failure</button></div>}
              {paymentState === "processing" && <p className="recharge-processing" role="status">Simulating {method} checkout…</p>}
              {paymentState === "success" && <div className="recharge-result recharge-result-success" role="status"><span className="recharge-result-icon"><Check aria-hidden="true" /></span><div><strong>Demo payment successful</strong><p>Tk {amount?.toFixed(2)} added to this temporary demo balance via {method}.</p><small>Reference: {transactionId}</small></div></div>}
              {paymentState === "failed" && <div className="recharge-result recharge-result-failed" role="alert"><span className="recharge-result-icon"><CircleAlert aria-hidden="true" /></span><div><strong>Demo payment not completed</strong><p>No balance was added. You can choose another method or try again.</p><button className="recharge-text-button" type="button" onClick={() => setPaymentState("ready")}>Try again</button></div></div>}
              <p className="recharge-security-note"><ShieldCheck aria-hidden="true" /> Live recharge will require campus sign-in and EPS merchant sandbox credentials.</p>
            </section>
          </>
        )}

        <section className="recharge-sample-note" aria-label="Demo account examples">
          <strong>Try a sample account</strong>
          <div><button type="button" onClick={() => { setLookup("JNU-2026-0142"); setLookupError("") }}>JNU-2026-0142 <span>Ayesha</span></button><button type="button" onClick={() => { setLookup("JNU-2026-0198"); setLookupError("") }}>JNU-2026-0198 <span>Nabil</span></button></div>
          {!account && <p>Enter an ID above and select Continue to begin the demo.</p>}
        </section>
      </div>
    </main>
  )
}
