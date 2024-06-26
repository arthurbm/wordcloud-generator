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
import { getWords } from "~/app/actions";
import { readStreamableValue } from "ai/rsc";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { type ModelName } from "~/types";
import { unstable_noStore as noStore } from "next/cache";

const schema = z.object({
  text: z.string().min(1, "Texto é obrigatório"),
  blacklistWords: z.string().optional(),
  model: z.string().optional(),
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
        const cleanedWord = word?.replace(/\.$/, ""); // Remove dot from the end of the line
        if (cleanedWord && count) {
          return acc.concat(Array(parseInt(count)).fill(cleanedWord));
        }
        return acc;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelName>("gpt-4o");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
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

  const handleExtractKeywords = async () => {
    const text = getValues("text");
    const blacklistWords = getValues("blacklistWords");
    setIsLoading(true);
    try {
      noStore();
      const keywords = await getWords(text, selectedModel, blacklistWords);
      for await (const content of readStreamableValue(keywords)) {
        setValue("text", content!);
      }
    } catch (error) {
      console.error("Erro ao extrair palavras-chave: ", error);
      toast.error("Falha ao extrair palavras-chave.");
    } finally {
      setIsLoading(false);
    }
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
        toast.success("Imagem copiada para a área de transferência!");
      } catch (error) {
        console.error("Erro ao copiar a imagem: ", error);
        toast.error("Falha ao copiar a imagem.");
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
      <div className="w-full max-w-7xl rounded-lg bg-white p-12 shadow-lg dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-center">
          <CloudIcon className="mr-2 text-3xl text-gray-900 dark:text-gray-100" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gerador de Nuvem de Palavras
          </h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="text"
                >
                  Digite seu texto separado por vírgulas ou palavras seguidas de
                  quantidade (ex: word, 5). Se quiser extrair palavras-chave, de
                  um texto bruto, clique no botão abaixo.
                </label>
                <Textarea
                  {...register("text")}
                  id="text"
                  placeholder="Digite ou cole seu texto aqui..."
                  rows={6}
                  disabled={isLoading}
                />
                {errors.text && (
                  <p className="text-red-500">{errors.text.message}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="text"
                >
                  Palavras a serem excluídas do resultado: (opcional)
                </label>
                <Textarea
                  {...register("blacklistWords")}
                  id="text"
                  placeholder="Digite ou cole seu texto aqui..."
                  rows={6}
                  disabled={isLoading}
                />
                {errors.text && (
                  <p className="text-red-500">{errors.text.message}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  htmlFor="model"
                >
                  Selecione o Modelo:
                </label>
                <RadioGroup
                  defaultValue={selectedModel}
                  onValueChange={(value: ModelName) => setSelectedModel(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="models/gemini-1.5-pro-latest"
                      id="model3"
                    />
                    <Label htmlFor="model3">Gemini 1.5 Pro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gpt-4o" id="model1" />
                    <Label htmlFor="model1">GPT 4o</Label>
                  </div>
                </RadioGroup>
                {errors.model && (
                  <p className="text-red-500">{errors.model.message}</p>
                )}
              </div>
              <Button
                type="button"
                onClick={handleExtractKeywords}
                disabled={isLoading}
              >
                {isLoading ? "Extraindo..." : "Extrair Palavras-Chave com IA"}
              </Button>
            </div>
            <div className="space-y-6">
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
                    id="width"
                    type="number"
                    disabled={isLoading}
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
                    id="height"
                    type="number"
                    disabled={isLoading}
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
                  id="scale"
                  type="number"
                  step={0.1}
                  disabled={isLoading}
                />
                {errors.scale && (
                  <p className="text-red-500">{errors.scale.message}</p>
                )}
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={isLoading || mutation.isPending}
              >
                {mutation.isPending ? "Gerando..." : "Gerar Nuvem de Palavras"}
              </Button>
              {imageSrc && (
                <div className="mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Word Cloud
                  </h2>
                  <img src={imageSrc} alt="Generated Word Cloud" />
                  <div className="mt-4 flex space-x-4">
                    <Button
                      variant={"secondary"}
                      onClick={handleCopyImage}
                      disabled={isLoading}
                    >
                      Copiar Imagem
                    </Button>
                    <Button
                      variant={"secondary"}
                      onClick={handleDownloadImage}
                      disabled={isLoading}
                    >
                      Baixar Imagem
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
        {mutation.isError && (
          <p className="mt-4 text-red-500">
            Erro ao gerar a nuvem de palavras: {mutation.error.message}
          </p>
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
