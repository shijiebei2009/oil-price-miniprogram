import { pgTable, serial, timestamp, varchar, text, jsonb, index, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 订阅消息表
export const subscriptionMessages = pgTable(
  "subscription_messages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    openid: varchar("openid", { length: 128 }).notNull(),
    templateId: varchar("template_id", { length: 128 }).notNull(),
    scene: varchar("scene", { length: 32 }).notNull(), // 'price_change' | 'price_alert'
    province: varchar("province", { length: 32 }),
    city: varchar("city", { length: 32 }),
    priceType: varchar("price_type", { length: 8 }), // '92' | '95' | '98' | '0'
    targetPrice: jsonb("target_price"), // 价格预警目标值
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("subscription_messages_openid_idx").on(table.openid),
    index("subscription_messages_scene_idx").on(table.scene),
    index("subscription_messages_expires_at_idx").on(table.expiresAt),
  ]
);

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertSubscriptionSchema = createCoercedInsertSchema(subscriptionMessages).pick({
  openid: true,
  templateId: true,
  scene: true,
  province: true,
  city: true,
  priceType: true,
  targetPrice: true,
  expiresAt: true,
});

// TypeScript types
export type SubscriptionMessage = typeof subscriptionMessages.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
