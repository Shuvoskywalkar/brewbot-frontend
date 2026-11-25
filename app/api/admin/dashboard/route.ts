import { asc, desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { devices, paymentAttempts } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

function startOfBangladeshDay(now: Date) {
  const bangladeshOffset = 6 * 60 * 60 * 1000
  const localTime = new Date(now.getTime() + bangladeshOffset)
  return new Date(Date.UTC(localTime.getUTCFullYear(), localTime.getUTCMonth(), localTime.getUTCDate()) - bangladeshOffset)
}

export async function GET() {
  try {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 401 })
    }

    const [orderRows, activeDevices] = await Promise.all([
      db.select({
        id: paymentAttempts.customerOrderId,
        createdAt: paymentAttempts.createdAt,
        productName: paymentAttempts.productName,
        status: paymentAttempts.status,
        amountPaisa: paymentAttempts.amountPaisa,
        paymentReference: paymentAttempts.epsTransactionId,
        deviceId: paymentAttempts.deviceId,
        locationName: devices.locationName,
      })
        .from(paymentAttempts)
        .leftJoin(devices, eq(paymentAttempts.deviceId, devices.deviceId))
        .orderBy(desc(paymentAttempts.createdAt))
        .limit(100),
      db.select({
        deviceId: devices.deviceId,
        universityName: devices.universityName,
        locationName: devices.locationName,
      })
        .from(devices)
        .where(eq(devices.isActive, true))
        .orderBy(asc(devices.universityName), asc(devices.locationName)),
    ])

    const todayStart = startOfBangladeshDay(new Date())
    const todaysOrders = orderRows.filter((order) => order.createdAt >= todayStart)
    const paidTotalPaisa = todaysOrders.reduce(
      (total, order) => total + (order.status === "paid" ? order.amountPaisa : 0),
      0,
    )

    return NextResponse.json({
      devices: activeDevices,
      orders: orderRows,
      ordersToday: todaysOrders.length,
      paidTotalPaisa,
    }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "Live admin data could not be loaded." }, { status: 503 })
  }
}
