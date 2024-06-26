"use client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const metadata = {
  title: "Wordcloud generator",
  description: "Generate wordclouds from text data",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" className={`${GeistSans.variable}`}>
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </QueryClientProvider>
  );
}
