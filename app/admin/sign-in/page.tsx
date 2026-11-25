import { redirect } from "next/navigation"
import { AdminSignIn } from "@/components/admin-sign-in"
import { getAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; verified?: string }>
}) {
  if (await getAdminUser()) redirect("/admin")
  const { denied, verified } = await searchParams
  return <AdminSignIn denied={denied === "1"} verified={verified === "1"} />
}
