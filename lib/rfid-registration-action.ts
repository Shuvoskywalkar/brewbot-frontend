'use server'

import { and, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { devices, rfidRegistrationRequests, rfidUsers } from "@/lib/db/schema"

type RegistrationInput = {
  deviceId: unknown
  studentName: unknown
  studentId: unknown
  cardHex: unknown
}

export type RfidRegistrationResult = "saved" | "duplicate" | "invalid" | "unavailable"

export async function submitRfidRegistration(input: RegistrationInput): Promise<RfidRegistrationResult> {
  if (!input || typeof input !== "object") return "invalid"

  const deviceId = typeof input.deviceId === "string" ? input.deviceId.trim() : ""
  const studentName = typeof input.studentName === "string" ? input.studentName.trim().replace(/\s+/g, " ") : ""
  const studentId = typeof input.studentId === "string" ? input.studentId.trim().replace(/\s+/g, " ") : ""
  const rawCardHex = typeof input.cardHex === "string" ? input.cardHex.trim() : ""
  const cardId = rawCardHex.replace(/[\s:-]/g, "").toUpperCase()

  if (!/^[A-Z0-9_-]{1,64}$/.test(deviceId)) return "invalid"
  if (studentName.length < 2 || studentName.length > 120) return "invalid"
  if (studentId.length < 1 || studentId.length > 80) return "invalid"
  if (rawCardHex.length > 96 || !/^(?:[A-F0-9]{2}){2,32}$/.test(cardId)) return "invalid"

  try {
    const [activeDevice] = await db
      .select({ deviceId: devices.deviceId })
      .from(devices)
      .where(and(eq(devices.deviceId, deviceId), eq(devices.isActive, true)))
      .limit(1)

    if (!activeDevice) return "invalid"

    const [existingUser] = await db
      .select({ id: rfidUsers.id })
      .from(rfidUsers)
      .where(and(
        eq(rfidUsers.deviceId, deviceId),
        eq(rfidUsers.isActive, true),
        sql`lower(trim(${rfidUsers.cardId})) = ${cardId.toLowerCase()}`,
      ))
      .limit(1)

    if (existingUser) return "duplicate"

    const [savedRequest] = await db
      .insert(rfidRegistrationRequests)
      .values({ deviceId, studentName, studentId, cardId })
      .onConflictDoNothing()
      .returning({ id: rfidRegistrationRequests.id })

    return savedRequest ? "saved" : "duplicate"
  } catch {
    return "unavailable"
  }
}
