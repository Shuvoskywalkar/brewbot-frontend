import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const devices = pgTable("devices", {
  deviceId: text("device_id").primaryKey(),
  universityName: text("university_name").notNull(),
  locationName: text("location_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pricePaisa: integer("price_paisa").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type PaymentAttemptStatus = "pending" | "paid" | "failed" | "cancelled"

export const paymentAttempts = pgTable("payment_attempts", {
  merchantTransactionId: text("merchant_transaction_id").primaryKey(),
  customerOrderId: text("customer_order_id").notNull().unique(),
  resultToken: text("result_token").notNull().unique(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  deviceId: text("device_id"),
  amountPaisa: integer("amount_paisa").notNull(),
  status: text("status").$type<PaymentAttemptStatus>().notNull().default("pending"),
  epsTransactionId: text("eps_transaction_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
})
