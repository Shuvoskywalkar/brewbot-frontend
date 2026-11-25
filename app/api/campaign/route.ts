import { NextResponse } from "next/server"
import { getActiveCampaign } from "@/lib/campaigns"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    return NextResponse.json({ campaign: await getActiveCampaign() }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json({ error: "The campaign is temporarily unavailable." }, { status: 503 })
  }
}
