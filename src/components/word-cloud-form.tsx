/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

const schema = z.object({
  text: z.string().min(1, "Texto é obrigatório"),
  width: z
    .number()
    .min(100, "Largura mínima é 100")
    .max(2000, "Largura máxima é 2000")
    .default(600),
  height: z
    .number()
    .min(100, "Altura mínima é 100")
    .max(2000, "Altura máxima é 2000")
    .default(600),
  scale: z
    .number()
    .min(0.1, "Escala mínima é 0.1")
    .max(5, "Escala máxima é 5")
    .default(2),
});

type FormData = z.infer<typeof schema>;

type Base64Image = {
  wordcloud: string;
};

const parseText = (text: string | undefined): string => {
  if (!text) return "";

  if (text.includes("\n")) {
    const lines = text.split("\n");
    return lines
      .reduce((acc, line) => {
        const [word, count] = line.split(",").map((item) => item.trim());
        return acc.concat(Array(parseInt(count ?? "0")).fill(word));
      }, [] as string[])
      .join(",");
  }
  return text;
};

const createWordCloud = async (data: FormData): Promise<string> => {
  const parsedText = parseText(data.text);
  const response = await fetch(
    "https://sp-wordcloud-mcjozft4ta-uc.a.run.app/generate-wordcloud",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: parsedText,
        width: data.width,
        height: data.height,
        scale: data.scale,
        colors: ["#3C69EB", "#E5335D", "#32CCB0", "#FCB400"],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const result = (await response.json()) as Base64Image;
  return result.wordcloud;
};

export function WordCloudForm() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      width: 1024,
      height: 400,
      scale: 0.5,
    },
  });

  const mutation = useMutation<string, Error, FormData>({
    mutationFn: createWordCloud,
    onSuccess: (data) => {
      setImageSrc(`data:image/png;base64,${data}`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleCopyImage = async () => {
    if (imageSrc) {
      try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        alert("Imagem copiada para a área de transferência!");
      } catch (error) {
        console.error("Erro ao copiar a imagem: ", error);
        alert("Falha ao copiar a imagem.");
      }
    }
  };

  const handleDownloadImage = () => {
    if (imageSrc) {
      const link = document.createElement("a");
      link.href = imageSrc;
      link.download = "wordcloud.png";
      link.click();
    }
  };

  return (
    <div
      key="1"
      className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 dark:bg-gray-900"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white p-12 shadow-lg dark:bg-gray-800">
        <div className="mb-6 flex items-center">
          <CloudIcon className="mr-4 text-3xl text-gray-900 dark:text-gray-100" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gerador de Nuvem de Palavras
          </h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="text"
            >
              Digite seu texto separado por vírgulas ou palavras seguidas de
              quantidade (ex: word, 5):
            </label>
            <Textarea
              {...register("text")}
              className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              id="text"
              placeholder="Digite ou cole seu texto aqui..."
              rows={6}
            />
            {errors.text && (
              <p className="text-red-500">{errors.text.message}</p>
            )}
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
                {...register("width", { valueAsNumber: true })}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                id="width"
                type="number"
              />
              {errors.width && (
                <p className="text-red-500">{errors.width.message}</p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor="height"
              >
                Altura:
              </label>
              <Input
                {...register("height", { valueAsNumber: true })}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                id="height"
                type="number"
              />
              {errors.height && (
                <p className="text-red-500">{errors.height.message}</p>
              )}
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
              {...register("scale", { valueAsNumber: true })}
              className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              id="scale"
              type="number"
              step={0.1}
            />
            {errors.scale && (
              <p className="text-red-500">{errors.scale.message}</p>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Gerando..." : "Gerar Nuvem de Palavras"}
          </Button>
        </form>
        {mutation.isError && (
          <p className="mt-4 text-red-500">
            Erro ao gerar a nuvem de palavras: {mutation.error.message}
          </p>
        )}
        {imageSrc && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Word Cloud
            </h2>
            <img src={imageSrc} alt="Generated Word Cloud" />
            <div className="mt-4 flex space-x-4">
              <Button variant={"secondary"} onClick={handleCopyImage}>
                Copiar Imagem
              </Button>
              <Button variant={"secondary"} onClick={handleDownloadImage}>
                Baixar Imagem
              </Button>
            </div>
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
      width="32"
      height="32"
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
