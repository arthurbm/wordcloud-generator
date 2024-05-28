"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function getWords(text: string) {
  console.log("getWords", text);
  const result = await generateText({
    model: openai("gpt-4-turbo"),
    messages: [
      {
        role: "user",
        content: `analise o texto a seguir e liste as X principais palavras chave com valor semantico para o contexto. você deve se concentrar exclusivamente nos substantivos, eliminando todas as outras classes de palavras, como adjetivos, verbos, advérbios, pronomes, artigos, numerais, preposições, conjunções e interjeições. extraia apenas os substantivos que sejam essenciais para captar os temas principais ou ideias centrais do texto. forneça a lista dos substantivos identificados como palavras-chave separadas por vírgulas. nunca numere a lista de palavras. acentue corretamente as palavras. Texto: ${text}`,
      },
    ],
  });

  return result.text;
}
