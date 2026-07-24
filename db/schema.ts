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

export const homepageContent = sqliteTable("homepage_content", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workPageContent = sqliteTable("work_page_content", {
  slug: text("slug").primaryKey(),
  content: text("content").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const fitnessSessions = sqliteTable("fitness_sessions", {
  id: text("id").primaryKey(),
  practicedOn: text("practiced_on").notNull(),
  sessionNumber: integer("session_number").notNull(),
  roundsCompleted: integer("rounds_completed").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
