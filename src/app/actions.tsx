"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
// import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { type ModelName } from "~/types";
// import { unstable_noStore as noStore } from "next/cache";

export async function getWords(
  text: string,
  modelName: ModelName,
  blackcklistWords?: string,
) {
  // const ollama = createOllama({
  //   baseURL: "http://213.163.246.171:40002/api",
  // });
  // console.log("modelName", modelName);

  const modelChooser = () => {
    switch (modelName) {
      case "gpt-4-turbo":
        return openai("gpt-4o");
      case "models/gemini-1.5-pro-latest":
        return google("models/gemini-1.5-pro-latest");
    }
  };

  const model = modelChooser();

  // noStore();
  const result = await streamText({
    model,
    // model: google("models/gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: `
        Your task is to analyze the text provided by the user and list between 35 and 40 of the main keywords with semantic value for the context.
        If there are between 35 and 40 words, I will give you a $200 tip. If not, you will be fired and replaced by another AI that can do the job better.
        You must focus exclusively on nouns and expressions, eliminating all other classes of words such as adjectives, verbs, adverbs, pronouns, articles, numerals, prepositions, conjunctions, and interjections.
        Extract only the nouns that are essential to capture the main themes or central ideas of the text.
        Provide the list of identified keywords as nouns separated by commas.
        Never number the list of words.
        Accentuate the words correctly.
        Compound words are considered as a single word. For example, "data analysis" is a single word. Do not separate them. If they are valuable, include them in the list.
        The words must appear in order of importance.
        Theh words must be in the same language as the text.
        Do not list company and people's names. Avoid nouns with little semantic value such as "table", "document", "participant", "conference", "debate", etc.
        Do not repeat words.
        Do not put a dot, comma or whitespace at the end of the list.
        ${blackcklistWords ? `Do not include these words on your answer: ${blackcklistWords}` : ""}

        Example:

        User Text: "A conferência internacional sobre mudanças climáticas, realizada em Paris, reuniu cientistas, políticos e ativistas de todo o mundo para discutir soluções para os problemas causados pelo aquecimento global. Os participantes destacaram os impactos devastadores nas regiões costeiras, como o aumento do nível do mar e a frequência de tempestades severas. Foram apresentados estudos sobre a degradação dos ecossistemas marinhos e terrestres, além da perda de biodiversidade. A importância de implementar práticas agrícolas sustentáveis foi amplamente debatida, com ênfase na redução do desmatamento e na promoção de técnicas de cultivo que preservem o solo e a água. Outro ponto crucial foi o papel das energias renováveis, como a solar e a eólica, na diminuição das emissões de carbono. Os especialistas sugeriram políticas públicas para incentivar a adoção dessas tecnologias e a necessidade de investimentos em pesquisa e desenvolvimento. A análise de dados recentes mostrou um aumento alarmante na concentração de gases de efeito estufa na atmosfera, reforçando a urgência de medidas concretas. As estratégias propostas incluíram desde reformas econômicas até a mobilização de comunidades locais para ações de mitigação e adaptação. O relatório final destacou a necessidade de uma cooperação internacional robusta e contínua para enfrentar os desafios impostos pelas mudanças climáticas e garantir um futuro sustentável para as próximas gerações."

        Response: "mudanças climáticas, Paris, cientistas, políticos, ativistas, soluções, problemas, aquecimento global, participantes, impactos, regiões costeiras, aumento do nível do mar, tempestades, estudos, degradação, ecossistemas marinhos, terrestres, perda de biodiversidade, práticas agrícolas sustentáveis, desmatamento, técnicas de cultivo, solo, água, energias renováveis, solar, eólica, emissões de carbono, políticas públicas, tecnologias, investimentos, pesquisa, desenvolvimento, gases de efeito estufa, atmosfera, medidas, reformas econômicas, mobilização"
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0,
    maxTokens: 200,
  });

  const stream = createStreamableValue(result.textStream);

  return stream.value;
}
