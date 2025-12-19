// Senior Frontend Engineer Refactor: Adhering to @google/genai guidelines
import { GoogleGenAI } from "@google/genai";

export const generateAIReport = async (data: {
  records: any[],
  filters: any
}) => {
  // Always initialize right before the API call to ensure we use the correct environment API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Using gemini-3-flash-preview for summarization task
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access the text property as defined in the SDK
    return response.text;
  } catch (error) {
    console.error("Erro na geração do relatório IA:", error);
    return "Ocorreu um erro ao processar o relatório rápido.";
  }
};