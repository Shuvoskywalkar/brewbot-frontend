import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { devices } from "@/lib/db/schema"

export async function getActiveDevice(deviceId: string) {
  const [device] = await db
    .select({
      deviceId: devices.deviceId,
      universityName: devices.universityName,
      locationName: devices.locationName,
    })
    .from(devices)
    .where(and(eq(devices.deviceId, deviceId), eq(devices.isActive, true)))
    .limit(1)

  return device
}
