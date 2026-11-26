"use client"

import Link from "next/link"
import { type FormEvent, useState } from "react"
import useSWR from "swr"
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, UserRoundPlus, WalletCards } from "lucide-react"
import { BrewBotLogo } from "@/components/brewbot-logo"
import { submitRfidRegistration, type RfidRegistrationResult } from "@/lib/rfid-registration-action"

type RechargeStep = "lookup" | "register"
type RfidAccount = { id: string; userName: string; cardId: string; walletBalancePaisa: number }
type AccountResponse = { account?: RfidAccount; status?: string; error?: string }

const fetcher = async (url: string): Promise<AccountResponse> => {
  const response = await fetch(url, { cache: "no-store" })
  return response.json()
}
const topupOptions = [10_000, 20_000, 50_000, 100_000]
const taka = (paisa: number) => `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`

export function RechargeFlow({ backHref, deviceId, resultToken }: { backHref: string; deviceId: string; resultToken?: string }) {
  const [step, setStep] = useState<RechargeStep>("lookup")
  const [lookupValue, setLookupValue] = useState("")
  const [userName, setUserName] = useState("")
  const [cardHex, setCardHex] = useState("")
  const [account, setAccount] = useState<RfidAccount | null>(null)
  const [lookupError, setLookupError] = useState("")
  const [lookupAttempted, setLookupAttempted] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<RfidRegistrationResult | null>(null)
  const [selectedAmount, setSelectedAmount] = useState(topupOptions[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  const resultUrl = resultToken ? `/api/rfid/lookup?deviceId=${encodeURIComponent(deviceId)}&resultToken=${encodeURIComponent(resultToken)}` : null
  const { data: paymentResult } = useSWR<AccountResponse>(resultUrl, fetcher, {
    refreshInterval: (latest) => latest?.status === "pending" ? 2500 : 0,
    revalidateOnFocus: true,
  })

  async function checkAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLookupAttempted(true)
    setLookupError("")
    setAccount(null)
    const query = new URLSearchParams({ deviceId, identifier: lookupValue.trim() })
    try {
      const response = await fetch(`/api/rfid/lookup?${query}`, { cache: "no-store" })
      const payload = await response.json() as AccountResponse
      if (!response.ok || !payload.account) throw new Error(payload.error || "Account not found.")
      setAccount(payload.account)
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Account lookup is temporarily unavailable.")
    }
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegistrationStatus(null)
    setIsSubmitting(true)
    try {
      const result = await submitRfidRegistration({ deviceId, userName, cardHex })
      setRegistrationStatus(result)
      if (result === "saved") {
        setUserName("")
        setCardHex("")
      }
    } catch {
      setRegistrationStatus("unavailable")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function startTopup() {
    if (!account) return
    setPaymentError("")
    setIsStartingPayment(true)
    try {
      const response = await fetch("/api/payments/eps/wallet-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          identifier: account.id,
          amountPaisa: selectedAmount,
          idempotencyKey: crypto.randomUUID(),
        }),
      })
      const payload = await response.json() as { redirectUrl?: string; error?: string }
      if (!response.ok || !payload.redirectUrl) throw new Error(payload.error || "Payment could not be started.")
      window.location.assign(payload.redirectUrl)
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment could not be started. Please try again.")
      setIsStartingPayment(false)
    }
  }

  function openRegistration() {
    setUserName("")
    setCardHex("")
    setStep("register")
    setRegistrationStatus(null)
  }

  function returnToLookup() {
    setStep("lookup")
    setRegistrationStatus(null)
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
          <p>Find your active RFID account and securely top up through EPS.</p>
        </div>

        {resultToken && paymentResult && (
          <div className={`recharge-inline-status ${paymentResult.status === "paid" ? "recharge-inline-status-success" : ""}`} role="status" aria-live="polite">
            {paymentResult.status === "paid" ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
            <p>
              <strong>{paymentResult.status === "paid" ? "Top-up confirmed." : paymentResult.status === "pending" ? "Confirming your payment…" : `Payment ${paymentResult.status || "result unavailable"}.`}</strong>
              <span>{paymentResult.account ? `${paymentResult.account.userName} · Current balance ${taka(paymentResult.account.walletBalancePaisa)}.` : "Your balance will update after EPS confirms the transaction."}</span>
            </p>
          </div>
        )}

        {step === "lookup" ? (
          <section className="recharge-card" aria-labelledby="account-heading">
            <div className="recharge-section-heading">
              <span className="recharge-step">01</span>
              <div><h2 id="account-heading">Find your RFID account</h2><p>Use your card number or BrewBot user ID.</p></div>
            </div>
            <form className="recharge-lookup-form" onSubmit={checkAccount}>
              <label htmlFor="account-lookup">Card number or user ID</label>
              <input id="account-lookup" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="Enter card number or user ID" autoComplete="off" required aria-describedby="account-lookup-hint" />
              <p className="recharge-hint" id="account-lookup-hint">Only active accounts for this kiosk can be recharged.</p>
              <button className="recharge-primary-button" type="submit" disabled={isStartingPayment}>Find account <ArrowRight aria-hidden="true" /></button>
            </form>
            {lookupError && <div className="recharge-inline-status" role="status"><CircleAlert aria-hidden="true" /><p><strong>Account not found.</strong><span>{lookupError}</span></p></div>}
            {lookupAttempted && account && (
              <div className="recharge-inline-status recharge-inline-status-success" role="status">
                <CheckCircle2 aria-hidden="true" />
                <p><strong>{account.userName}</strong><span>Current balance: {taka(account.walletBalancePaisa)}</span></p>
              </div>
            )}
            {account && (
              <section className="recharge-card recharge-payment-card" aria-labelledby="payment-heading">
                <div className="recharge-section-heading">
                  <span className="recharge-step">02</span>
                  <div><h2 id="payment-heading">Choose top-up amount</h2><p>EPS confirms payment before your wallet is credited.</p></div>
                </div>
                <div className="recharge-amount-options" role="group" aria-label="Top-up amount">
                  {topupOptions.map((amount) => (
                    <button key={amount} className={`recharge-amount-option ${selectedAmount === amount ? "is-selected" : ""}`} type="button" aria-pressed={selectedAmount === amount} onClick={() => setSelectedAmount(amount)}>{taka(amount)}</button>
                  ))}
                </div>
                <p className="recharge-payment-note">Selected: {taka(selectedAmount)}. Wallet balance changes only after EPS verifies this exact amount.</p>
                {paymentError && <div className="recharge-inline-status" role="alert"><CircleAlert aria-hidden="true" /><p><strong>Unable to start payment.</strong><span>{paymentError}</span></p></div>}
                <button className="recharge-primary-button" type="button" onClick={startTopup} disabled={isStartingPayment}>
                  {isStartingPayment ? "Opening EPS…" : `Continue to EPS · ${taka(selectedAmount)}`} <ArrowRight aria-hidden="true" />
                </button>
              </section>
            )}
            <button className="recharge-text-button recharge-register-link" type="button" onClick={openRegistration}><UserRoundPlus aria-hidden="true" /> Register a new RFID card</button>
          </section>
        ) : (
          <section className="recharge-card" aria-labelledby="registration-heading">
            <div className="recharge-section-heading">
              <span className="recharge-step">01</span>
              <div><h2 id="registration-heading">Register your RFID card</h2><p>Your active account is created immediately.</p></div>
              <button className="recharge-text-button" type="button" onClick={returnToLookup}>Back</button>
            </div>
            <form className="recharge-lookup-form" onSubmit={submitRegistration} aria-busy={isSubmitting}>
              <label htmlFor="user-name">Your name</label>
              <input id="user-name" name="userName" value={userName} onChange={(event) => setUserName(event.target.value)} autoComplete="name" placeholder="Enter your name" required />
              <label htmlFor="card-hex">Card number</label>
              <input id="card-hex" name="cardHex" value={cardHex} onChange={(event) => setCardHex(event.target.value)} autoComplete="off" placeholder="Enter the HEX printed on your card" required />
              <p className="recharge-hint">No admin or maintainer approval is required. Your card number must not already be active on this kiosk.</p>
              <button className="recharge-primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Registering…" : "Register card"} <ArrowRight aria-hidden="true" /></button>
            </form>
            {registrationStatus && (
              <div className={`recharge-inline-status ${registrationStatus === "saved" ? "recharge-inline-status-success" : ""}`} role="status">
                {registrationStatus === "saved" ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
                <p>
                  <strong>{registrationStatus === "saved" ? "RFID account created." : registrationStatus === "duplicate" ? "Name or card already active." : registrationStatus === "invalid" ? "Check your details." : "Registration unavailable."}</strong>
                  <span>{registrationStatus === "saved" ? "Your card is now active and ready for wallet top-ups." : registrationStatus === "duplicate" ? "An active account already uses this name or card on this kiosk." : registrationStatus === "invalid" ? "Enter your name and the HEX printed on your RFID card." : "We could not save your account right now. Please try again."}</span>
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
