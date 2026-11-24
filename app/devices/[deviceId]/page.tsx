import { DeviceStorefront } from "@/components/device-storefront"

export default async function DevicePage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params
  return <DeviceStorefront deviceId={deviceId} />
}
