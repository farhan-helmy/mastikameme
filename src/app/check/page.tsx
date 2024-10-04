import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function checkPage() {
  const checkUser = async () => {
    const { sessionClaims } = auth();

    if (!sessionClaims) return;
    const res = await db
      .select()
      .from(user)
      .where(eq(user.email, sessionClaims?.email as string));

    if (res.length === 0) {
      const userRes = await db
        .insert(user)
        .values({
          email: sessionClaims?.email as string,
          name: sessionClaims?.name as string,
          profile_picture: sessionClaims?.image_url as string,
        })
        .returning({
          id: user.id,
        });

      if (userRes.length === 0) {
        throw new Error("Failed to create user");
      }

      return redirect("/");
    }

    return redirect("/");
  };
  await checkUser();
  return (
    <div className="h-screen flex items-center justify-center">
      <div>loading...</div>
    </div>
  );
}
