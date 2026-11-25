import type { Metadata } from "next"
import { RechargeFlow } from "@/components/recharge-flow"
import { DEFAULT_DEVICE_PATH } from "@/lib/device-routes"

export const metadata: Metadata = {
  title: "RFID Wallet Recharge | BrewBot",
  description: "Find your campus RFID account, request card registration, and top up your BrewBot wallet."
}

type RechargePageProps = { searchParams: Promise<{ deviceId?: string }> }

export default async function RechargePage({ searchParams }: RechargePageProps) {
  const { deviceId } = await searchParams
  const backHref = deviceId && /^[A-Z0-9_-]{1,64}$/.test(deviceId) ? `/${encodeURIComponent(deviceId)}` : DEFAULT_DEVICE_PATH

  return <RechargeFlow backHref={backHref} />
}
