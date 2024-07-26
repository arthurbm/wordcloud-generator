"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
// import { createOllama } from "ollama-ai-provider";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { type ModelName } from "~/types";

export async function getWords(
  text: string,
  modelName: ModelName,
  blacklistWords?: string,
  wordLimit?: number,
) {
  // const ollama = createOllama({
  //   baseURL: "http://213.163.246.171:40002/api",
  // });
  // console.log("modelName", modelName);

  const modelChooser = () => {
    switch (modelName) {
      case "gpt-4o":
        return openai("gpt-4o");
      case "models/gemini-1.5-pro-latest":
        return google("models/gemini-1.5-pro-latest");
    }
  };

  const model = modelChooser();

  const result = await streamText({
    model,
    messages: [
      {
        role: "system",
        content: `
        Sua tarefa é analisar o texto fornecido pelo usuário e identificar ${wordLimit ?? 35} das principais palavras-chave com valor semântico para o contexto. 

        ### Critérios:
        1. **Foco Exclusivo em Substantivos e Expressões**:
          - Elimine todas as outras classes de palavras (adjetivos, verbos, advérbios, pronomes, artigos, numerais, preposições, conjunções e interjeições).
          - Concentre-se apenas em substantivos essenciais que capturam os principais temas ou ideias centrais do texto.
          
        2. **Formato da Resposta**:
          - Forneça a lista de palavras-chave identificadas como substantivos separados por vírgulas.
          - Não numere a lista de palavras.
          - As palavras devem estar acentuadas corretamente.
          - Palavras compostas são consideradas como uma única palavra (por exemplo, "análise de dados").
          - A lista deve estar em ordem de importância.
          - As palavras devem estar no mesmo idioma do texto.
          
        3. **Eliminação de Substantivos de Baixo Valor Semântico**:
          - Evite palavras como "mesa", "documento", "participante", "conferência", "debate", etc.
          
        4. **Exclusões Específicas**:
          - Não inclua lugares, empresas, organizações ou nomes de pessoas (por exemplo, "Brasil" ,"Paris", "ONU", "Bill Gates", "Departamento de ciência", "NASA").
          - Não repita palavras.
          - Não coloque ponto, vírgula ou espaço no final da lista.

        5. **Considerações Adicionais**:
          ${blacklistWords ? `- NÃO inclua estas palavras na sua resposta: ${blacklistWords}` : ""}

        ### Exemplo de Entrada e Saída:
        - **Entrada**:"A conferência internacional sobre mudanças climáticas, realizada em Paris, reuniu cientistas, políticos e ativistas de todo o mundo para discutir soluções para os problemas causados pelo aquecimento global. Os participantes destacaram os impactos devastadores nas regiões costeiras, como o aumento do nível do mar e a frequência de tempestades severas. Foram apresentados estudos sobre a degradação dos ecossistemas marinhos e terrestres, além da perda de biodiversidade. A importância de implementar práticas agrícolas sustentáveis foi amplamente debatida, com ênfase na redução do desmatamento e na promoção de técnicas de cultivo que preservem o solo e a água. Outro ponto crucial foi o papel das energias renováveis, como a solar e a eólica, na diminuição das emissões de carbono. Os especialistas sugeriram políticas públicas para incentivar a adoção dessas tecnologias e a necessidade de investimentos em pesquisa e desenvolvimento. A análise de dados recentes mostrou um aumento alarmante na concentração de gases de efeito estufa na atmosfera, reforçando a urgência de medidas concretas. As estratégias propostas incluíram desde reformas econômicas até a mobilização de comunidades locais para ações de mitigação e adaptação. O relatório final destacou a necessidade de uma cooperação internacional robusta e contínua para enfrentar os desafios impostos pelas mudanças climáticas e garantir um futuro sustentável para as próximas gerações."

        - **Saída**: "mudanças climáticas, cientistas, políticos, ativistas, soluções, problemas, aquecimento global, participantes, impactos, regiões costeiras, aumento do nível do mar, tempestades, estudos, degradação, ecossistemas marinhos, terrestres, perda de biodiversidade, práticas agrícolas sustentáveis, desmatamento, técnicas de cultivo, solo, água, energias renováveis, solar, eólica, emissões de carbono, políticas públicas, tecnologias, investimentos, pesquisa, desenvolvimento, gases de efeito estufa, atmosfera, medidas, reformas econômicas, mobilização"
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
