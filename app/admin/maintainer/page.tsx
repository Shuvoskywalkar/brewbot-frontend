import type { Metadata } from "next"
import { MaintainerAdmin } from "@/components/maintainer-admin"

export const metadata: Metadata = {
  title: "Device maintainer | BrewBot",
  description: "Review kiosk status and manage RFID user access for a BrewBot device.",
}

export default function MaintainerPage() {
  return <MaintainerAdmin />
}
