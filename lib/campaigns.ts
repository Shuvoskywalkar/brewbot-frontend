import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { campaigns } from "@/lib/db/schema"

export type BrewbotCampaign = {
  id: string
  headline: string
  supportingText: string
  artworkUrl: string | null
}

function serializeCampaign(campaign: typeof campaigns.$inferSelect): BrewbotCampaign {
  return {
    id: campaign.id,
    headline: campaign.headline,
    supportingText: campaign.supportingText,
    artworkUrl: campaign.artworkUrl,
  }
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
