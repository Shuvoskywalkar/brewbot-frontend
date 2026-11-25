import { redirect } from "next/navigation"

type LegacyDevicePageProps = {
  params: Promise<{ deviceId: string }>
}

export default async function LegacyDevicePage({ params }: LegacyDevicePageProps) {
  const { deviceId } = await params
  redirect(`/${encodeURIComponent(deviceId)}`)
}
