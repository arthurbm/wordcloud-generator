"use server";

import { z } from "zod";

const schema = z.object({
  text: z.string().min(1, "Texto é obrigatório"),
  width: z
    .number()
    .min(300, "Largura mínima é 300")
    .max(1000, "Largura máxima é 1000")
    .default(600),
  height: z
    .number()
    .min(300, "Altura mínima é 300")
    .max(1000, "Altura máxima é 1000")
    .default(600),
  scale: z
    .number()
    .min(0.1, "Escala mínima é 0.1")
    .max(5, "Escala máxima é 5")
    .default(2),
});

type Base64Image = {
  wordcloud: string;
};

export async function generateWordCloud(
  prevState: unknown,
  formData: FormData,
): Promise<string> {
  const formValues = Object.fromEntries(formData.entries());
  const parsedData = schema.safeParse(formValues);

  if (!parsedData.success) {
    const error = `Erro: ${parsedData.error.message}`;
    throw new Error(error);
  }

  const { text, width, height, scale } = parsedData.data;

  const response = await fetch(
    "https://sp-wordcloud-mcjozft4ta-uc.a.run.app/generate-wordcloud",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        width,
        height,
        scale,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const result = (await response.json()) as Base64Image;
  return result.wordcloud;
}
