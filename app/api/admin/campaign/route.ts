import { del, put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin-auth"
import { isSameOriginRequest } from "@/lib/request-origin"
import { getActiveCampaign, saveActiveCampaign } from "@/lib/campaigns"

export const dynamic = "force-dynamic"

const MAX_ARTWORK_BYTES = 4 * 1024 * 1024
const artworkExtensions: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

async function adminResponse() {
  try {
    return await getAdminUser() ? null : NextResponse.json({ error: "Admin access required." }, { status: 401 })
  } catch {
    return NextResponse.json({ error: "Admin access could not be verified." }, { status: 503 })
  }
}

function isAllowedArtworkUrl(value: string) {
  return !value || /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)
}

export async function GET() {
  const denied = await adminResponse()
  if (denied) return denied

  try {
    return NextResponse.json({ campaign: await getActiveCampaign() }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch {
    return NextResponse.json({ error: "Campaign could not be loaded." }, { status: 503 })
  }
}

export async function PUT(request: NextRequest) {
  const denied = await adminResponse()
  if (denied) return denied
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Campaign details could not be read." }, { status: 400 })
  }

  const headline = formData.get("headline")
  const supportingText = formData.get("supportingText")
  const rawArtworkUrl = formData.get("artworkUrl")
  const rawArtwork = formData.get("artwork")
  const artworkUrl = typeof rawArtworkUrl === "string" ? rawArtworkUrl.trim() : ""

  if (
    typeof headline !== "string" || headline.trim().length < 1 || headline.trim().length > 100 ||
    typeof supportingText !== "string" || supportingText.trim().length > 400 ||
    typeof rawArtworkUrl !== "string" || artworkUrl.length > 2048 || !isAllowedArtworkUrl(artworkUrl) ||
    (rawArtwork !== null && !(rawArtwork instanceof File))
  ) {
    return NextResponse.json({ error: "Check the campaign details and try again." }, { status: 400 })
  }

  let uploadedArtwork: { url: string } | null = null
  if (rawArtwork instanceof File && rawArtwork.size > 0) {
    const contentType = rawArtwork.type.toLowerCase()
    const extension = artworkExtensions[contentType]
    if (!extension || rawArtwork.size > MAX_ARTWORK_BYTES) {
      return NextResponse.json({ error: "Choose a supported image smaller than 4 MB." }, { status: 400 })
    }

    try {
      uploadedArtwork = await put(`campaigns/${crypto.randomUUID()}.${extension}`, rawArtwork, {
        access: "public",
        addRandomSuffix: false,
        contentType,
      })
    } catch {
      return NextResponse.json({ error: "Campaign artwork could not be uploaded." }, { status: 503 })
    }
  }

  try {
    const campaign = await saveActiveCampaign({
      headline: headline.trim(),
      supportingText: supportingText.trim(),
      artworkUrl: uploadedArtwork?.url ?? (artworkUrl || null),
    })
    return NextResponse.json({ campaign }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    if (uploadedArtwork) await del(uploadedArtwork.url).catch(() => undefined)
    return NextResponse.json({ error: "Campaign could not be saved." }, { status: 503 })
  }
}
