"use server";

import { db } from "@/db";
import { InsertMeme, user } from "@/db/schema";
import { handleApiRequest } from "@/lib/utils";
import { meme } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function addGenerateMeme(insertMeme: InsertMeme) {
  return handleApiRequest(async () => {
    const { sessionClaims } = auth();

    const email = sessionClaims?.email;

    const res = await db.transaction(async (tx) => {
      const userRes = await tx.query.user.findFirst({
        where: eq(user.email, email as string),
      });

      if (!userRes) {
        throw new Error("User not found");
      }

      const memeInsert = await db
        .insert(meme)
        .values({
          ...insertMeme,
          userId: userRes?.id,
        })
        .returning({
          id: meme.id,
        });

      return memeInsert;
    });

    return res;
  });
}