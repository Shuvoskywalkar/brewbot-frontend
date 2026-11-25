import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ productId: string }> }

function requestIsSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    const suppliedOrigin = new URL(origin).origin
    const forwardedHosts = request.headers.get("x-forwarded-host")?.split(",") ?? []
    const hosts = [
      ...forwardedHosts,
      request.headers.get("host") ?? "",
      request.nextUrl.host,
    ].map((host) => host.trim().toLowerCase()).filter(Boolean)
    const protocols = [
      ...(request.headers.get("x-forwarded-proto")?.split(",") ?? []),
      request.nextUrl.protocol.replace(":", ""),
    ].map((protocol) => protocol.trim().toLowerCase()).filter((protocol) => protocol === "http" || protocol === "https")

    return hosts.some((host) => protocols.some((protocol) => suppliedOrigin === `${protocol}://${host}`))
  } catch {
    return false
  }
}

function validateProduct(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const description = typeof input.description === "string" ? input.description.trim() : ""
  const image = typeof input.image === "string" ? input.image.trim() : ""
  const { pricePaisa, stock, sortOrder, isActive } = input

  if (
    name.length < 1 || name.length > 120 ||
    description.length > 1000 || image.length > 2048 ||
    !Number.isInteger(pricePaisa) || Number(pricePaisa) < 1 || Number(pricePaisa) > 100_000_000 ||
    !Number.isInteger(stock) || Number(stock) < 0 || Number(stock) > 100_000 ||
    !Number.isInteger(sortOrder) || Number(sortOrder) < 0 || Number(sortOrder) > 100_000 ||
    typeof isActive !== "boolean"
  ) return null

  if (image && !(/^\/(?!\/)/.test(image) || /^https:\/\//i.test(image))) return null

  return {
    name,
    description,
    imageUrl: image,
    pricePaisa: Number(pricePaisa),
    stock: Number(stock),
    sortOrder: Number(sortOrder),
    isActive,
    updatedAt: new Date(),
  }
}

async function adminResponse() {
  try {
    return await getAdminUser() ? null : NextResponse.json({ error: "Admin access required." }, { status: 401 })
  } catch {
    return NextResponse.json({ error: "Admin access could not be verified." }, { status: 503 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = await adminResponse()
  if (denied) return denied
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })

  const { productId } = await params
  const product = validateProduct(await request.json().catch(() => null))
  if (!product) return NextResponse.json({ error: "Check the product details and try again." }, { status: 400 })

  try {
    const [updated] = await db.update(products).set(product).where(eq(products.id, productId)).returning()
    if (!updated) return NextResponse.json({ error: "Product not found." }, { status: 404 })
    return NextResponse.json({ product: { ...product, id: updated.id, image: updated.imageUrl } })
  } catch {
    return NextResponse.json({ error: "Product could not be updated." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = await adminResponse()
  if (denied) return denied
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })

  const { productId } = await params
  try {
    const [archived] = await db.update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning({ id: products.id })
    if (!archived) return NextResponse.json({ error: "Product not found." }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Product could not be archived." }, { status: 500 })
  }
}
