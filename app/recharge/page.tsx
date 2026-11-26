import type { Metadata } from "next"
import { RechargeFlow } from "@/components/recharge-flow"
import { DEFAULT_DEVICE_ID } from "@/lib/device-routes"

export const metadata: Metadata = {
  title: "RFID Wallet Recharge | BrewBot",
  description: "Register an RFID card or securely top up your BrewBot wallet through EPS."
}

type RechargePageProps = { searchParams: Promise<{ deviceId?: string; resultToken?: string }> }

export default async function RechargePage({ searchParams }: RechargePageProps) {
  const params = await searchParams
  const deviceId = params.deviceId && /^[A-Z0-9_-]{1,64}$/.test(params.deviceId) ? params.deviceId : DEFAULT_DEVICE_ID
  const resultToken = params.resultToken && /^[0-9a-f-]{36}$/i.test(params.resultToken) ? params.resultToken : undefined
  const backHref = `/${encodeURIComponent(deviceId)}`

  return <RechargeFlow backHref={backHref} deviceId={deviceId} resultToken={resultToken} />
}
