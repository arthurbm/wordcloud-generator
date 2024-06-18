"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
// import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { type ModelName } from "~/types";
import { unstable_noStore as noStore } from "next/cache";

export async function getWords(
  text: string,
  modelName: ModelName,
  blackcklistWords?: string,
) {
  // const ollama = createOllama({
  //   baseURL: "http://213.163.246.171:40002/api",
  // });

  const modelChooser = () => {
    switch (modelName) {
      case "gpt-4-turbo":
        return openai("gpt-4o");
      case "models/gemini-1.5-pro-latest":
        return google("models/gemini-1.5-pro-latest");
    }
  };

  const model = modelChooser();

  noStore();
  const result = await streamText({
    model,
    // model: google("models/gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: `
        Your task is to analyze the text provided by the user and list ONLY 37 of the main keywords with semantic value for the context.
        If there are EXACTLY 37 words, I will give you a $200 tip. If not, you will be fired and replaced by another AI that can do the job better.
        You must focus exclusively on nouns, eliminating all other classes of words such as adjectives, verbs, adverbs, pronouns, articles, numerals, prepositions, conjunctions, and interjections.
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
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.5,
  });

  const stream = createStreamableValue(result.textStream);

  return stream.value;
}
