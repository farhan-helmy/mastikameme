ALTER TABLE "meme" ALTER COLUMN "upvote" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "meme" ADD COLUMN "user_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meme" ADD CONSTRAINT "meme_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
