
import { GoogleGenAI, Type } from "@google/genai";
import { CustomerData, ModelMetrics, PredictionResult, CleaningAction, GlobalInsights, ColumnMapping, FeedbackInsight } from "../types.ts";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanAIResponse = (text: string | undefined): string => {
  if (!text) return "[]";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return cleaned.startsWith('[') || cleaned.startsWith('{') ? cleaned : "[]";
};

export const callDatabricksAIFunction = async (feedbacks: {id: any, text: string}[]): Promise<FeedbackInsight> => {
  const ai = getAI();
  const prompt = `Analyze sentiment: ${JSON.stringify(feedbacks.slice(0, 50))}. Output pure JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            samples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  rating: { type: Type.STRING, enum: ['Excelente', 'Bom', 'Médio', 'Ruim', 'Horrível'] },
                  score: { type: Type.NUMBER }
                },
                required: ["text", "rating", "score"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(cleanAIResponse(response.text));
  } catch (err) {
    return { sentiment: 'Neutral', score: 0.5, mainThemes: [], summary: 'Error', samples: [] };
  }
};

export const suggestDataCleaning = async (dataSample: CustomerData[]): Promise<CleaningAction[]> => {
  const ai = getAI();
  const prompt = `
    TASK: Act as a Databricks Data Quality Auditor. Identify critical issues in the dataset.
    
    SPECIAL FOCUS - MISPLACED TEXT:
    - Look for columns (like 'gender', 'age', 'partner') that should have SHORT categories but contain LONG sentences or feedback.
    - If a column mostly has values like 'Male/Female' or '1/0' but some rows have text like 'The internet is slow', flag them as 'remove_outliers'.
    
    DATA SAMPLE: ${JSON.stringify(dataSample.slice(0, 20))}
    
    INSTRUCTIONS:
    1. Check for consistency. If a column has long strings (>3 words) mixed with short codes, the long strings are ERRORS.
    2. Suggest 'replace_values' for minor typos.
    3. Suggest 'remove_outliers' (setting to null) for misplaced feedback text in columns where it doesn't belong.
    
    OUTPUT: JSON list of actions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['replace_values', 'normalize_text', 'remove_outliers'] },
              target: { type: Type.STRING },
              description: { type: Type.STRING },
              reason: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              replacementPairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING }
                  },
                  required: ["from", "to"]
                }
              }
            },
            required: ["id", "type", "target", "description", "severity"]
          }
        }
      }
    });
    return JSON.parse(cleanAIResponse(response.text));
  } catch (err) {
    return [];
  }
};

export const getGlobalInsights = async (dataSample: CustomerData[], mapping: ColumnMapping, isScoring: boolean = false): Promise<GlobalInsights> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform global churn analysis. Current status: ${isScoring ? 'Scoring mode' : 'Training mode'}. Data: ${JSON.stringify(dataSample.slice(0, 10))}`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return JSON.parse(cleanAIResponse(response.text));
  } catch (err) {
    return { averageChurn: 0.1, riskDistribution: { Low: 30, Medium: 40, High: 30 }, criticalSegments: [], improvementAction: "" };
  }
};

export const simulateModelTournament = async (dataSample: CustomerData[], features: string[], target: string): Promise<ModelMetrics[]> => {
  const baseModels: ModelMetrics[] = [
    { name: 'Logistic Regression', accuracy: 0.76, recall: 0.62, auc: 0.71, suggested: false, description: 'Baseline interpretável para auditoria linear.' },
    { name: 'Random Forest', accuracy: 0.82, recall: 0.74, auc: 0.80, suggested: false, description: 'Ótimo para capturar relações complexas entre as variáveis.' },
    { name: 'XGBoost (Photon)', accuracy: 0.88, recall: 0.84, auc: 0.89, suggested: true, description: 'Performance otimizada com motor Photon da Databricks.' }
  ];

  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest 2-3 additional specific machine learning models (like SVM, AdaBoost, etc.) to predict ${target} based on features ${features.join(', ')}. Return an array of objects with keys: name, accuracy (0.6-0.9), recall (0.6-0.9), auc (0.6-0.9), description (string). No markdown, just JSON.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const aiModelsRaw = JSON.parse(cleanAIResponse(response.text));
    
    const aiModels = (Array.isArray(aiModelsRaw) ? aiModelsRaw : []).map(m => ({
      name: m.name || 'AI Model',
      accuracy: parseFloat(m.accuracy) || 0.75,
      recall: parseFloat(m.recall) || 0.70,
      auc: parseFloat(m.auc) || 0.72,
      suggested: false,
      description: m.description || 'Modelo sugerido pela Mosaic AI.'
    }));

    return [...baseModels, ...aiModels].slice(0, 6);
  } catch (err) {
    return baseModels;
  }
};

export const getPredictionInsight = async (customer: CustomerData, features: string[], target: string, model: string, idCol: string, feedbackCol: string): Promise<PredictionResult> => {
  const ai = getAI();
  const prompt = `Explain churn risk audit for customer ID ${customer[idCol]}.
  
  CONTEXT:
  - Raw Customer Data: ${JSON.stringify(customer)}
  - Target variable to avoid: ${target}
  - Features selected by user: ${features.join(', ')}
  - Feedback/Comments field: ${feedbackCol} (Value: ${customer[feedbackCol] || 'No feedback provided'})
  
  TASK:
  1. Identify the 'topDrivers' based on features that look problematic in the data (e.g. high prices, low usage, bad feedback).
  2. Write a professional 'reasoning' explaining the risk.
  3. Provide 3-4 actionable 'recommendations' to retain this specific customer.
  4. Estimate churn probability (0 to 1).
  
  OUTPUT: JSON ONLY.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerId: { type: Type.STRING },
            customerFeedback: { type: Type.STRING },
            churnProbability: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            sentimentScore: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            topDrivers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  feature: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                },
                required: ["feature", "impact", "severity"]
              }
            }
          },
          required: ["customerId", "churnProbability", "riskLevel", "reasoning", "topDrivers", "recommendations"]
        }
      }
    });
    const result = JSON.parse(cleanAIResponse(response.text));
    
    // Garantir que o feedback original apareça se a IA não retornou
    if (!result.customerFeedback && customer[feedbackCol]) {
      result.customerFeedback = String(customer[feedbackCol]);
    }
    
    return result;
  } catch (err) {
    return { 
      customerId: String(customer[idCol]), 
      churnProbability: 0.5, 
      riskLevel: 'Medium', 
      sentimentScore: 0.5, 
      reasoning: "Não foi possível completar a auditoria automática via Gemini.", 
      recommendations: ["Entrar em contato direto com o cliente", "Verificar histórico de chamados recentes"], 
      topDrivers: [{ feature: "Geral", impact: "Análise inconclusiva", severity: "medium" }],
      customerFeedback: String(customer[feedbackCol] || "")
    };
  }
};

export const chatWithData = async (query: string, sampleData: CustomerData[]) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: ${JSON.stringify(sampleData.slice(0, 5))}. Query: ${query}`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text;
  } catch (err) {
    return "Erro no processamento.";
  }
};
