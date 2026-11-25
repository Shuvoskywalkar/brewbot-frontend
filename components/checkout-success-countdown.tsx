"use client"

import { useEffect, useState } from "react"

type CheckoutSuccessCountdownProps = {
  expiresAt: number
  initialSeconds: number
  homePath: string
}

export function CheckoutSuccessCountdown({ expiresAt, initialSeconds, homePath }: CheckoutSuccessCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds)

  useEffect(() => {
    let hasRedirected = false

    function updateCountdown() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setSecondsRemaining(remaining)

      if (remaining === 0 && !hasRedirected) {
        hasRedirected = true
        window.location.replace(homePath)
      }
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [expiresAt, homePath])

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  return (
    <div
      className="checkout-result-countdown"
      role="timer"
      aria-label={`Dispensing access expires in ${secondsRemaining} seconds`}
    >
      <span>Time remaining</span>
      <strong>{formattedTime}</strong>
    </div>
  )
}
