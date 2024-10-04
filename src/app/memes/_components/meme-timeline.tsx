import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Image from "next/image";
import { Heart, MessageCircle, Share, ArrowLeft } from "lucide-react";
import { cloudfrontUrl } from "@/config/index";
import { Meme } from "@/db/schema";
import { formatTemplateName } from "@/lib/utils";
import Link from "next/link";
import { Creepster } from 'next/font/google';

const creepster = Creepster({
  display: "swap",
  weight: "400",
  subsets: ["latin"],
});

export function MemeTimeline({ memes }: { memes: Meme[] }) {
  return (
    <div className="max-w-md mx-auto space-y-4 py-4 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="link" size="sm" className={`flex text-white items-center gap-2 p-0 ${creepster.className}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
        <h1 className={`${creepster.className} text-xl sm:text-3xl text-purple-600`}>Mastika Meme Collection</h1>
      </div>
      {memes.map((meme) => (
        <Card key={meme.id} className="overflow-hidden shadow-md">
          <CardHeader className="p-3">
            <h2 className={`${creepster.className} text-lg text-purple-500`}>{formatTemplateName(meme.template)}</h2>
          </CardHeader>
          <CardContent className="p-0">
            {meme.filePath && (
              <Image
                src={`${cloudfrontUrl}${meme.filePath}`}
                alt={`Meme: ${meme.name || "Untitled"}`}
                width={400}
                height={400}
                className="w-full h-auto"
              />
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2 pt-2 p-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="p-1">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Share className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm font-semibold">{meme.upvote || 0} upvotes</p>
            </div>
            <p className="text-sm text-gray-500 w-full">
              Created: {meme.createdAt ? new Date(meme.createdAt).toLocaleDateString() : "Unknown"}
            </p>
            {meme.name && (
              <p className="text-sm text-gray-600 w-full">
                By: <span className="font-semibold">{meme.name}</span>
              </p>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}