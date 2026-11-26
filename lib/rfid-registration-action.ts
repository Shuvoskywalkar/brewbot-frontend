'use server'

import { and, eq, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { devices, rfidUsers } from "@/lib/db/schema"

type RegistrationInput = {
  deviceId: unknown
  userName: unknown
  cardHex: unknown
}

export type RfidRegistrationResult = "saved" | "duplicate" | "invalid" | "unavailable"

export async function submitRfidRegistration(input: RegistrationInput): Promise<RfidRegistrationResult> {
  if (!input || typeof input !== "object") return "invalid"

  const deviceId = typeof input.deviceId === "string" ? input.deviceId.trim() : ""
  const userName = typeof input.userName === "string" ? input.userName.trim().replace(/\s+/g, " ") : ""
  const rawCardHex = typeof input.cardHex === "string" ? input.cardHex.trim() : ""
  const cardId = rawCardHex.replace(/[\s:-]/g, "").toUpperCase()

  if (!/^[A-Z0-9_-]{1,64}$/.test(deviceId)) return "invalid"
  if (userName.length < 2 || userName.length > 120) return "invalid"
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
        or(
          sql`lower(trim(${rfidUsers.cardId})) = ${cardId.toLowerCase()}`,
          sql`lower(trim(${rfidUsers.userName})) = ${userName.toLowerCase()}`,
        ),
      ))
      .limit(1)

    if (existingUser) return "duplicate"

    const [savedUser] = await db
      .insert(rfidUsers)
      .values({ deviceId, userName, cardId })
      .onConflictDoNothing()
      .returning({ id: rfidUsers.id })

    return savedUser ? "saved" : "duplicate"
  } catch {
    return "unavailable"
  }
}
