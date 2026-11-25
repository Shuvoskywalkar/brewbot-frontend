import { and, asc, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"

export type BrewbotProduct = {
  id: string
  name: string
  description: string
  pricePaisa: number
  image: string
  stock: number
  isActive: boolean
  sortOrder: number
}

function toBrewbotProduct(product: typeof products.$inferSelect): BrewbotProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    pricePaisa: product.pricePaisa,
    image: product.imageUrl,
    stock: product.stock,
    isActive: product.isActive,
    sortOrder: product.sortOrder,
  }
}

export async function getActiveProducts() {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), asc(products.name))

  return rows.map(toBrewbotProduct)
}

export async function getAllProducts() {
  const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.name))
  return rows.map(toBrewbotProduct)
}

export async function getBrewbotProduct(id: unknown) {
  if (typeof id !== "string" || !id) return null

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isActive, true), gt(products.stock, 0)))
    .limit(1)

  return product ? toBrewbotProduct(product) : null
}
