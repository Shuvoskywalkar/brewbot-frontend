import { redirect } from "next/navigation"
import { DEFAULT_DEVICE_PATH } from "@/lib/device-routes"

export default function Home() {
  redirect(DEFAULT_DEVICE_PATH)
}
