import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  publishedAt: text("published_at").notNull(),
  mood: text("mood", { enum: ["sad", "neutral", "happy"] })
    .notNull()
    .default("neutral"),
  city: text("city").notNull().default("Shanghai"),
  isPrivate: integer("is_private", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
