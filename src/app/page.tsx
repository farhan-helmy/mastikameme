"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import dynamic from "next/dynamic";

const MemeGenerator = dynamic(() => import("./_components/mastika-generator"), {
  ssr: false,
});

const MemeGeneratorMobile = dynamic(
  () => import("./_components/meme-generator-mobile"),
  {
    ssr: false,
  }
);

export default function Home() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  return <div>{isDesktop ? <MemeGenerator /> : <MemeGeneratorMobile />}</div>;
}
