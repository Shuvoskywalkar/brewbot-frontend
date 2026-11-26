import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { campaigns } from "@/lib/db/schema"

export type BrewbotCampaign = {
  id: string
  headline: string
  supportingText: string
  artworkUrl: string | null
}

const PRIVATE_ARTWORK_PREFIX = "private-blob:"
export const PRIVATE_CAMPAIGN_ARTWORK_URL = "/api/campaign/artwork"
const privateArtworkPathPattern = /^campaigns\/[0-9a-f-]{36}\.(?:avif|gif|jpg|png|webp)$/i

export function storePrivateCampaignArtworkPath(pathname: string) {
  if (!privateArtworkPathPattern.test(pathname)) throw new Error("Invalid campaign artwork path.")
  return `${PRIVATE_ARTWORK_PREFIX}${pathname}`
}

function parsePrivateCampaignArtworkPath(value: string | null) {
  if (!value?.startsWith(PRIVATE_ARTWORK_PREFIX)) return null
  const pathname = value.slice(PRIVATE_ARTWORK_PREFIX.length)
  return privateArtworkPathPattern.test(pathname) ? pathname : null
}

function serializeCampaign(campaign: typeof campaigns.$inferSelect): BrewbotCampaign {
  const privateArtworkPath = parsePrivateCampaignArtworkPath(campaign.artworkUrl)
  return {
    id: campaign.id,
    headline: campaign.headline,
    supportingText: campaign.supportingText,
    artworkUrl: privateArtworkPath ? PRIVATE_CAMPAIGN_ARTWORK_URL : campaign.artworkUrl,
  }
}

export async function getActiveCampaignPrivateArtworkPath() {
  const [campaign] = await db
    .select({ artworkUrl: campaigns.artworkUrl })
    .from(campaigns)
    .where(eq(campaigns.isActive, true))
    .limit(1)

  return parsePrivateCampaignArtworkPath(campaign?.artworkUrl ?? null)
}

export async function getActiveCampaign() {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.isActive, true))
    .limit(1)

  return campaign ? serializeCampaign(campaign) : null
}

export async function saveActiveCampaign(input: Omit<BrewbotCampaign, "id">) {
  const updatedAt = new Date()
  const [campaign] = await db
    .insert(campaigns)
    .values({
      headline: input.headline,
      supportingText: input.supportingText,
      artworkUrl: input.artworkUrl,
      isActive: true,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: campaigns.isActive,
      targetWhere: sql`${campaigns.isActive} = true`,
      set: {
        headline: input.headline,
        supportingText: input.supportingText,
        artworkUrl: input.artworkUrl,
        updatedAt,
      },
    })
    .returning()

  if (!campaign) throw new Error("Campaign could not be saved.")
  return serializeCampaign(campaign)
}
