import { text, timestamp, pgTable, bigint, pgEnum } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

export const templateEnum = pgEnum("template", [
  "MASTIKA_1",
  "MASTIKA_2",
  "MASTIKA_3",
  "MASTIKA_4",
]);

export type templateType = typeof templateEnum;

export const user = pgTable("user", {
  id: text("id")
    .$defaultFn(() => ulid())
    .primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  profile_picture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;

export const meme = pgTable("meme", {
  id: text("id")
    .$defaultFn(() => ulid())
    .primaryKey(),
  name: text("name"),
  template: templateEnum("template"),
  upvote: bigint("upvote", {
    mode: "number",
  }).default(0),
  filePath: text("file_path"),
  userId: text("user_id").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Meme = typeof meme.$inferSelect;
export type InsertMeme = typeof meme.$inferInsert;