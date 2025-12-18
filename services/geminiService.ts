
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key for Gemini not found.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAIReport = async (data: {
  records: any[],
  filters: any
}) => {
  const client = getClient();
  if (!client) return "Configuração de API necessária para análise. Verifique sua chave API.";

  try {
    const prompt = `
      Você é um Consultor Técnico de Avicultura de Postura. 
      Gere um RELATÓRIO EXPRESSO (curto e direto) baseado nos dados abaixo.

      DADOS DE PRODUÇÃO (Data, Aviário, Ovos, Taxa %, Mortalidade, Notas de Manejo):
      ${JSON.stringify(data.records)}

      FILTROS APLICADOS:
      ${JSON.stringify(data.filters)}

      INSTRUÇÕES DE FORMATO:
      1. Use linguagem técnica mas extremamente concisa.
      2. Foque no cruzamento de dados: Se houve queda de postura ou aumento de mortalidade, busque a explicação nas "Notas de Manejo/Observações" fornecidas.
      3. Use Markdown.

      ESTRUTURA DO RELATÓRIO:
      - **DESEMPENHO GERAL**: (Métricas principais em uma linha).
      - **ANÁLISE DE OCORRÊNCIAS**: (Relacione as quedas/picos com as observações registradas no campo 'Notas').
      - **RECOMENDAÇÃO RÁPIDA**: (Ação imediata baseada no que foi observado).
      
      Língua: Português Brasileiro. Seja rápido e evite introduções longas.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview', // Mudado para Flash para ser mais rápido
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Erro na geração do relatório IA:", error);
    return "Ocorreu um erro ao processar o relatório rápido.";
  }
};
