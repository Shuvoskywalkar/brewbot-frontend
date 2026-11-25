import { NextResponse } from "next/server"
import { getActiveProducts } from "@/lib/products"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    return NextResponse.json({ products: await getActiveProducts() }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json({ error: "The menu is temporarily unavailable." }, { status: 503 })
  }
}
