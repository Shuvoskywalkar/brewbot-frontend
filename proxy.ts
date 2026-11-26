import { auth } from "@/lib/auth/server"

export default auth.middleware({
  loginUrl: "/admin/sign-in",
  publicRoutes: ["/admin/sign-in"],
})

export const config = {
  matcher: ["/admin/:path*"],
}
