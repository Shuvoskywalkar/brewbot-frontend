import { notFound } from "next/navigation"
import { DeviceStorefront } from "@/components/device-storefront"
import { getActiveDevice } from "@/lib/device-registry"

type DevicePageProps = {
  params: Promise<{ deviceId: string }>
}

export default async function DevicePage({ params }: DevicePageProps) {
  const { deviceId } = await params
  const device = await getActiveDevice(deviceId)

  if (!device) notFound()

  return (
    <DeviceStorefront
      deviceId={device.deviceId}
      universityName={device.universityName}
      locationName={device.locationName}
    />
  )
}
