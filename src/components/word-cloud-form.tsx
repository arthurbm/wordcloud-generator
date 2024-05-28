"use client";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { generateWordCloud } from "~/actions";
import { SubmitButton } from "./submit-button";
import { useFormState } from "react-dom";

export function WordCloudForm() {
  const [state, formAction] = useFormState(generateWordCloud, "");

  return (
    <div
      key="1"
      className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-900"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white p-12 shadow-lg dark:bg-gray-800">
        <div className="mb-6 flex items-center">
          <CloudIcon className="mr-2 text-3xl text-gray-900 dark:text-gray-100" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gerador de Nuvem de Palavras
          </h1>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="text"
            >
              Digite seu texto separado por vírgulas:
            </label>
            <Textarea
              name="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              id="text"
              placeholder="Digite ou cole seu texto separado por vírgulas aqui..."
              rows={6}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="width"
              >
                Largura:
              </label>
              <Input
                name="width"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                id="width"
                type="number"
                defaultValue={600}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="height"
              >
                Altura:
              </label>
              <Input
                name="height"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                id="height"
                type="number"
                defaultValue={600}
              />
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="scale"
            >
              Escala:
            </label>
            <Input
              name="scale"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              id="scale"
              type="number"
              defaultValue={2}
              step={0.1}
            />
          </div>
          <SubmitButton />
        </form>
        {/* {error && (
          <p className="mt-4 text-red-500">
            Erro ao gerar a nuvem de palavras: {error}
          </p>
        )} */}
        {state !== "" && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Word Cloud
            </h2>
            <img src={state} alt="Generated Word Cloud" />
          </div>
        )}
      </div>
    </div>
  );
}

function CloudIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}
