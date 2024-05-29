"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createOllama } from "ollama-ai-provider";

export async function getWords(text: string) {
  const ollama = createOllama({
    baseURL: "http://213.163.246.171:40002/api",
  });

  const result = await streamText({
    model: ollama("aya:8b"),
    messages: [
      {
        role: "user",
        content: `analise o texto a seguir e liste as X principais palavras chave com valor semantico para o contexto. você deve se concentrar exclusivamente nos substantivos, eliminando todas as outras classes de palavras, como adjetivos, verbos, advérbios, pronomes, artigos, numerais, preposições, conjunções e interjeições. extraia apenas os substantivos que sejam essenciais para captar os temas principais ou ideias centrais do texto. forneça a lista dos substantivos identificados como palavras-chave separadas por vírgulas. nunca numere a lista de palavras. acentue corretamente as palavras. as palavras devem aparecer em ordem de importância. Texto: ${text}`,
      },
    ],
  });

  const stream = createStreamableValue(result.textStream);

  return stream.value;
}
