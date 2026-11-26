import { redirect } from "next/navigation"
import { MaintainerSignIn } from "@/components/maintainer-sign-in"
import { getMaintainerUser } from "@/lib/maintainer-auth"

export const dynamic = "force-dynamic"

export default async function MaintainerSignInPage() {
  if (await getMaintainerUser()) redirect("/admin/maintainer")
  return <MaintainerSignIn />
}
