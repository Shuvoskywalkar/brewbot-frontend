import { redirect } from "next/navigation"
import { AdminSignIn } from "@/components/admin-sign-in"
import { getAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export default async function AdminSignInPage() {
  if (await getAdminUser()) redirect("/admin")
  return <AdminSignIn />
}
