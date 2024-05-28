import { WordCloudForm } from "~/components/word-cloud-form";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <WordCloudForm />
    </main>
  );
}
