
export interface CustomerData {
  [key: string]: any;
}

export interface ModelMetrics {
  name: string;
  accuracy: number;
  recall: number;
  auc: number;
  suggested: boolean;
  description: string;
}

export interface ColumnMapping {
  targetColumn: string;
  featureColumns: string[];
  idColumn: string;
  feedbackColumn: string; 
  monthlyIncomeColumn: string; 
  totalIncomeColumn: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  company: string;
  userId: string;
  createdAt: string;
  mapping: ColumnMapping;
  selectedModel: string;
  isTrained: boolean;
  isExternal?: boolean;
  modelUri?: string;
}

export interface User {
  id: string;
  username: string;
  company: string;
  contact: string;
}

export interface FeedbackInsight {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  score: number;
  mainThemes: string[];
  summary: string;
  samples: { 
    text: string; 
    sentiment: string; 
    score: number;
    rating: 'Excelente' | 'Bom' | 'Médio' | 'Ruim' | 'Horrível' 
  }[];
}

export interface PredictionResult {
  customerId: string;
  customerFeedback?: string;
  churnProbability: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  sentimentScore: number;
  reasoning: string;
  recommendations: string[];
  topDrivers: {
    feature: string;
    impact: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

export interface GlobalInsights {
  averageChurn: number;
  riskDistribution: { Low: number; Medium: number; High: number };
  criticalSegments: string[];
  improvementAction: string;
  totalRevenue?: number;
  potentialLoss?: number;
  monthlyTrends?: { month: string; income: number; churnRate: number }[];
}

export interface CleaningAction {
  id: string;
  type: 'replace_values' | 'normalize_text' | 'remove_outliers';
  target: string;
  description: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  replacementPairs?: { from: string; to: string }[];
}

export type Step = 'landing' | 'project_init' | 'model_import' | 'workspace' | 'upload' | 'preview' | 'cleaning' | 'setup' | 'nlp_verification' | 'insights' | 'tournament' | 'validation' | 'global_dashboard';

export interface FeatureImpact {
  feature: string;
  category: string;
  churnRate: number;
  impact: number;
  volume: number;
}

export interface VariableStats {
  variable: string;
  type: 'numeric' | 'categorical';
  explainingPower: number;
  pValue: number;
  relevant: boolean;
}
