"use client";
import { WordCloudForm } from "~/components/word-cloud-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function HomePage() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <WordCloudForm />
      </main>
    </QueryClientProvider>
  );
}
