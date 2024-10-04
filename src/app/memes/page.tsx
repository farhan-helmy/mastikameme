import { db } from "@/db";
import { MemeTimeline } from "./_components/meme-timeline";
import { desc } from "drizzle-orm";
import { meme } from "@/db/schema";

export default async function MemePage() {
  const memes = await db.query.meme.findMany({
    orderBy: [desc(meme.createdAt)],
  });

  console.log(memes);
  return (
    <div className="bg-black">
      <MemeTimeline memes={memes} />
    </div>
  );
}
