import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { OwnerAdmin } from "@/components/owner-admin"
import { getAdminAccess } from "@/lib/admin-auth"
import { getAllProducts } from "@/lib/products"
import { getActiveCampaign } from "@/lib/campaigns"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Owner workspace | BrewBot",
  description: "Review BrewBot device status, order records, product content, and advertisements.",
}

export default async function AdminPage() {
  const { user, authorized } = await getAdminAccess()
  if (!authorized) redirect(user ? "/admin/sign-in?denied=1" : "/admin/sign-in")
  const [products, campaign] = await Promise.all([getAllProducts(), getActiveCampaign()])
  return <OwnerAdmin initialProducts={products} initialCampaign={campaign} />
}
