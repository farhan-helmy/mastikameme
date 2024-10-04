import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mastika Meme Generator",
  description: "Mastika | Meme Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            src="https://analytics.farhanhelmy.com/script.js"
            data-website-id="68bd3187-29ca-4ba1-b3f5-a065ec2f5dd9"
          />
        )}

        <body>
          <main>{children}</main>

          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
