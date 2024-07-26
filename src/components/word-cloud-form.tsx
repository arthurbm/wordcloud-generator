/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getWords } from "~/app/actions";
import { readStreamableValue } from "ai/rsc";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { type ModelName } from "~/types";
import { unstable_noStore as noStore } from "next/cache";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

const schema = z.object({
  text: z.string().min(1, "Texto é obrigatório"),
  blacklistWords: z.string().optional(),
  model: z.string().optional(),
  width: z
    .number()
    .min(100, "Largura mínima é 100")
    .max(2000, "Largura máxima é 2000"),
  wordLimit: z
    .number()
    .min(1, "Limite mínimo é 1")
    .max(100, "Limite máximo é 100"),
  height: z
    .number()
    .min(100, "Altura mínima é 100")
    .max(2000, "Altura máxima é 2000"),
  scale: z.number().min(0.1, "Escala mínima é 0.1").max(5, "Escala máxima é 5"),
  colors: z.array(z.string()).optional(),
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
  console.log("data colors", data.colors);
  const colors =
    data.colors && data.colors?.length > 0
      ? data.colors
      : ["#3C69EB", "#E5335D", "#32CCB0", "#FCB400"];
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
        colors,
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      width: 2000,
      height: 1050,
      scale: 1,
      wordLimit: 35,
      colors: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    // @ts-expect-error - TS doesn't like the fact that we're using a string as a key
    name: "colors",
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
    const text = form.getValues("text");
    const blacklistWords = form.getValues("blacklistWords");
    setIsLoading(true);
    try {
      noStore();
      const keywords = await getWords(text, selectedModel, blacklistWords);
      for await (const content of readStreamableValue(keywords)) {
        form.setValue("text", content!);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Digite ou cole seu texto aqui..."
                          rows={6}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Digite seu texto separado por vírgulas ou palavras
                        seguidas de quantidade (ex: word, 5).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wordLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" disabled={isLoading} />
                      </FormControl>
                      <FormDescription>Quantidade de Palavras</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blacklistWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excluir</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Digite ou cole seu texto aqui..."
                          rows={6}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Palavras a serem excluídas (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <RadioGroup
                    defaultValue={selectedModel}
                    onValueChange={(value: ModelName) =>
                      setSelectedModel(value)
                    }
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
                  <FormMessage />
                </FormItem>
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
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Largura mínima: 100, máxima: 2000
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Altura mínima: 100, máxima: 2000
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escala</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step={0.1}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Escala mínima: 0.1, máxima: 5
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Cores</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {fields.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            type="color"
                            {...form.register(`colors.${index}` as const)}
                            // @ts-expect-error - TS doesn't like the fact that we're using a string as a key
                            defaultValue={item}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={isLoading}
                          >
                            X
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => append("#000000")}
                        disabled={isLoading}
                      >
                        Adicionar Cor
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Adicione as cores desejadas para a nuvem de palavras. Se
                    ficar vazio, será usado as cores padrão (Azul, Vermelho,
                    Verde e Amarelo).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={isLoading || mutation.isPending}
                >
                  {mutation.isPending
                    ? "Gerando..."
                    : "Gerar Nuvem de Palavras"}
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
        </Form>
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
