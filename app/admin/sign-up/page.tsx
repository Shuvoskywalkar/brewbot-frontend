import { redirect } from "next/navigation"
import { AdminSignUp } from "@/components/admin-sign-up"
import { getAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

export default async function AdminSignUpPage() {
  if (await getAdminUser()) redirect("/admin")
  return <AdminSignUp />
}
