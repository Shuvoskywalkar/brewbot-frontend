import { sql } from "drizzle-orm"
import { bigint, boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

export const adminAccounts = pgTable("admin", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

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

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  headline: text("headline").notNull(),
  supportingText: text("supporting_text").notNull().default(""),
  artworkUrl: text("artwork_url"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("campaigns_one_active_idx").on(table.isActive).where(sql`${table.isActive} = true`),
])

export const rfidUsers = pgTable("rfid_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull(),
  userName: text("user_name").notNull(),
  cardId: text("card_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("rfid_users_device_id_card_id_key").on(table.deviceId, table.cardId),
  uniqueIndex("rfid_users_device_name_idx").on(table.deviceId, sql`lower(trim(${table.userName}))`).where(sql`${table.isActive} = true`),
])

export type RfidRegistrationStatus = "pending" | "approved" | "rejected"

export const rfidRegistrationRequests = pgTable("rfid_registration_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id").notNull(),
  cardId: text("card_id").notNull(),
  status: text("status").$type<RfidRegistrationStatus>().notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("rfid_registration_pending_card_idx").on(table.deviceId, sql`lower(trim(${table.cardId}))`).where(sql`${table.status} = 'pending'`),
])
