import type { Metadata } from "next"
import { OwnerAdmin } from "@/components/owner-admin"

export const metadata: Metadata = {
  title: "Owner workspace | BrewBot",
  description: "Review BrewBot device status, order records, product content, and advertisements.",
}

export default function AdminPage() {
  return <OwnerAdmin />
}
