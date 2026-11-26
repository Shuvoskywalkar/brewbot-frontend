import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { MaintainerAdmin } from "@/components/maintainer-admin"
import { getMaintainerUser } from "@/lib/maintainer-auth"

export const metadata: Metadata = {
  title: "Device maintainer | BrewBot",
  description: "Review kiosk status and manage RFID user access for a BrewBot device.",
}

export default async function MaintainerPage() {
  if (!(await getMaintainerUser())) redirect("/admin/maintainer/sign-in")
  return <MaintainerAdmin />
}
