import type { Metadata } from "next"
import { RechargeDemo } from "@/components/recharge-demo"
import { DEFAULT_DEVICE_PATH } from "@/lib/device-routes"

export const metadata: Metadata = {
  title: "RFID Wallet Recharge | BrewBot",
  description: "Explore a demo of adding balance to a BrewBot campus RFID wallet using bKash, Nagad, or online banking.",
}

type RechargePageProps = { searchParams: Promise<{ deviceId?: string }> }

export default async function RechargePage({ searchParams }: RechargePageProps) {
  const { deviceId } = await searchParams
  const backHref = deviceId && /^[A-Z0-9_-]{1,64}$/.test(deviceId) ? `/${encodeURIComponent(deviceId)}` : DEFAULT_DEVICE_PATH

  return <RechargeDemo backHref={backHref} />
}
