import { and, eq, ne, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { rfidUsers, rfidWalletTopups } from "@/lib/db/schema"
import { verifyEPSTransaction } from "@/lib/payments/eps"

export const runtime = "nodejs"

function resultRedirect(request: NextRequest, deviceId?: string, resultToken?: string) {
  const url = new URL("/recharge", request.url)
  if (deviceId) url.searchParams.set("deviceId", deviceId)
  if (resultToken) url.searchParams.set("resultToken", resultToken)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams
  const merchantTransactionId = search.get("merchantTransactionId") ?? search.get("MerchantTransactionId")
  if (!merchantTransactionId || !/^\d{10,30}$/.test(merchantTransactionId)) return resultRedirect(request)

  try {
    const [topup] = await db.select().from(rfidWalletTopups)
      .where(eq(rfidWalletTopups.merchantTransactionId, merchantTransactionId)).limit(1)
    if (!topup) return resultRedirect(request)
    if (topup.status === "paid") return resultRedirect(request, topup.deviceId, topup.resultToken)

    const verification = await verifyEPSTransaction(merchantTransactionId).catch(() => null)
    if (!verification) return resultRedirect(request, topup.deviceId, topup.resultToken)
    const matches = verification.merchantTransactionId === merchantTransactionId &&
      verification.amountPaisa === topup.amountPaisa
    const verified = matches && verification.status === "success"

    if (verified) {
      await db.transaction(async (tx) => {
        const [settled] = await tx.update(rfidWalletTopups).set({
          status: "paid",
          epsTransactionId: verification.epsTransactionId,
          updatedAt: new Date(),
          paidAt: new Date(),
        }).where(and(
          eq(rfidWalletTopups.merchantTransactionId, merchantTransactionId),
          ne(rfidWalletTopups.status, "paid"),
        )).returning({ rfidUserId: rfidWalletTopups.rfidUserId, amountPaisa: rfidWalletTopups.amountPaisa })

        if (settled) {
          await tx.update(rfidUsers).set({
            walletBalancePaisa: sql`${rfidUsers.walletBalancePaisa} + ${settled.amountPaisa}`,
            updatedAt: new Date(),
          }).where(eq(rfidUsers.id, settled.rfidUserId))
        }
      })
    } else {
      const status = !matches
        ? "failed"
        : verification.status === "cancelled" || verification.status === "canceled"
          ? "cancelled"
          : verification.status === "pending"
            ? "pending"
            : "failed"
      await db.update(rfidWalletTopups).set({
        status,
        epsTransactionId: verification.epsTransactionId,
        updatedAt: new Date(),
      }).where(and(
        eq(rfidWalletTopups.merchantTransactionId, merchantTransactionId),
        ne(rfidWalletTopups.status, "paid"),
      ))
    }

    return resultRedirect(request, topup.deviceId, topup.resultToken)
  } catch {
    return resultRedirect(request)
  }
}
