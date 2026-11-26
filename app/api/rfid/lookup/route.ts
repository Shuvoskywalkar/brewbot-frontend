import { and, eq, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { devices, rfidUsers, rfidWalletTopups } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

function validDeviceId(value: string | null): value is string {
  return Boolean(value && /^[A-Z0-9_-]{1,64}$/.test(value))
}

function serializeAccount(user: typeof rfidUsers.$inferSelect) {
  return {
    id: user.id,
    userName: user.userName,
    cardId: user.cardId,
    walletBalancePaisa: user.walletBalancePaisa,
  }
}

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get("deviceId")
  const resultToken = request.nextUrl.searchParams.get("resultToken")
  if (!validDeviceId(deviceId)) return NextResponse.json({ error: "Invalid device." }, { status: 400 })

  try {
    if (resultToken && /^[0-9a-f-]{36}$/i.test(resultToken)) {
      const [topup] = await db.select({
        status: rfidWalletTopups.status,
        rfidUserId: rfidWalletTopups.rfidUserId,
        deviceId: rfidWalletTopups.deviceId,
      }).from(rfidWalletTopups)
        .where(eq(rfidWalletTopups.resultToken, resultToken)).limit(1)
      if (!topup || topup.deviceId !== deviceId) return NextResponse.json({ error: "Payment result not found." }, { status: 404 })
      const [user] = await db.select().from(rfidUsers).where(eq(rfidUsers.id, topup.rfidUserId)).limit(1)
      return NextResponse.json({ status: topup.status, account: user ? serializeAccount(user) : null }, {
        headers: { "Cache-Control": "no-store" },
      })
    }

    const identifier = request.nextUrl.searchParams.get("identifier")?.trim()
    if (!identifier || identifier.length > 80) return NextResponse.json({ error: "Enter a card number or user ID." }, { status: 400 })
    const [device] = await db.select({ deviceId: devices.deviceId }).from(devices)
      .where(and(eq(devices.deviceId, deviceId), eq(devices.isActive, true))).limit(1)
    if (!device) return NextResponse.json({ error: "This device is not active." }, { status: 400 })

    const [user] = await db.select().from(rfidUsers).where(and(
      eq(rfidUsers.deviceId, deviceId),
      eq(rfidUsers.isActive, true),
      /^[0-9a-f-]{36}$/i.test(identifier)
        ? eq(rfidUsers.id, identifier)
        : sql`lower(trim(${rfidUsers.cardId})) = ${identifier.replace(/[\s:-]/g, "").toLowerCase()}`,
    )).limit(1)
    if (!user) return NextResponse.json({ error: "No active RFID account matched that card number or user ID." }, { status: 404 })
    return NextResponse.json({ account: serializeAccount(user) }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "RFID account lookup is temporarily unavailable." }, { status: 503 })
  }
}
