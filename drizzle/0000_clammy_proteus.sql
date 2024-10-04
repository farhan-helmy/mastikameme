DO $$ BEGIN
 CREATE TYPE "public"."template" AS ENUM('MASTIKA_1', 'MASTIKA_2', 'MASTIKA_3', 'MASTIKA_4');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meme" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"template" "template",
	"upvote" bigint,
	"file_path" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
