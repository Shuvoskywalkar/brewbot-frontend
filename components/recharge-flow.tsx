"use client"

import Link from "next/link"
import { type FormEvent, useState } from "react"
import { ArrowLeft, ArrowRight, CircleAlert, UserRoundPlus, WalletCards } from "lucide-react"
import { BrewBotLogo } from "@/components/brewbot-logo"

type RechargeStep = "lookup" | "register"

export function RechargeFlow({ backHref }: { backHref: string }) {
  const [step, setStep] = useState<RechargeStep>("lookup")
  const [lookupValue, setLookupValue] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [cardHex, setCardHex] = useState("")
  const [lookupAttempted, setLookupAttempted] = useState(false)
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false)

  function checkAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLookupAttempted(true)
  }

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegistrationSubmitted(true)
  }

  function openRegistration() {
    setLookupValue("")
    setStudentName("")
    setStudentId("")
    setCardHex("")
    setStep("register")
    setRegistrationSubmitted(false)
  }

  function returnToLookup() {
    setStep("lookup")
    setRegistrationSubmitted(false)
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

        {step === "lookup" ? (
          <section className="recharge-card" aria-labelledby="account-heading">
            <div className="recharge-section-heading">
              <span className="recharge-step">01</span>
              <div><h2 id="account-heading">Find your RFID account</h2><p>Enter the HEX code on your card or your BrewBot user ID.</p></div>
            </div>
            <form className="recharge-lookup-form" onSubmit={checkAccount}>
              <label htmlFor="account-lookup">Card HEX or user ID</label>
              <input id="account-lookup" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="Enter your card HEX or user ID" autoComplete="off" required aria-describedby="account-lookup-hint" />
              <p className="recharge-hint" id="account-lookup-hint">Your student ID card has a HEX code. If your card does not support NFC, ask your device maintainer to issue and register an NFC card.</p>
              <button className="recharge-primary-button" type="submit">Continue <ArrowRight aria-hidden="true" /></button>
            </form>
            {lookupAttempted && <div className="recharge-inline-status" role="status"><CircleAlert aria-hidden="true" /><p><strong>Account lookup is not available yet.</strong><span>Your card HEX or user ID has not been checked or saved. You can still view the registration steps below.</span></p></div>}
            <button className="recharge-text-button recharge-register-link" type="button" onClick={openRegistration}><UserRoundPlus aria-hidden="true" /> Register a new RFID card</button>
          </section>
        ) : (
          <section className="recharge-card" aria-labelledby="registration-heading">
            <div className="recharge-section-heading">
              <span className="recharge-step">01</span>
              <div><h2 id="registration-heading">Register your RFID card</h2><p>Enter your student details to request a new wallet account.</p></div>
              <button className="recharge-text-button" type="button" onClick={returnToLookup}>Back</button>
            </div>
            <form className="recharge-lookup-form" onSubmit={submitRegistration}>
              <label htmlFor="student-name">Full name on student ID</label>
              <input id="student-name" name="studentName" value={studentName} onChange={(event) => setStudentName(event.target.value)} autoComplete="name" placeholder="Enter your full name" required />
              <label htmlFor="student-id">University student ID</label>
              <input id="student-id" name="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)} autoComplete="off" placeholder="Enter your student ID" required />
              <label htmlFor="card-hex">Card HEX code</label>
              <input id="card-hex" name="cardHex" value={cardHex} onChange={(event) => setCardHex(event.target.value)} autoComplete="off" placeholder="Type the HEX printed on your card" required />
              <p className="recharge-hint">Student verification is required before a new RFID account can be activated.</p>
              <button className="recharge-primary-button" type="submit">Submit registration <ArrowRight aria-hidden="true" /></button>
            </form>
            {registrationSubmitted && <div className="recharge-inline-status" role="status"><CircleAlert aria-hidden="true" /><p><strong>Registration is not available yet.</strong><span>No details were sent or saved. Please contact your device maintainer to register your card.</span></p></div>}
          </section>
        )}

        <section className="recharge-card recharge-payment-card" aria-labelledby="payment-heading">
          <div className="recharge-section-heading">
            <span className="recharge-step">02</span>
            <div><h2 id="payment-heading">Top-up payment</h2><p>Payment provider setup is pending.</p></div>
          </div>
          <p className="recharge-payment-note">No payment will be accepted and no wallet balance will change until a payment provider is connected.</p>
          <button className="recharge-primary-button" type="button" disabled>Payment setup pending</button>
        </section>
      </div>
    </main>
  )
}
