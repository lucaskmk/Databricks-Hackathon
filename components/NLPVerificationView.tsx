
import React, { useState, useMemo, useEffect } from 'react';
import { FeedbackInsight, CustomerData } from '../types';

interface Props {
  insight: FeedbackInsight | null;
  feedbackColumn: string;
  rawData: CustomerData[];
  onContinue: (excludedIndices: number[]) => void;
  onBack: () => void;
  processingMode?: 'standard' | 'mosaic';
  language: 'pt' | 'en';
}

export const NLPVerificationView: React.FC<Props> = ({ insight, feedbackColumn, rawData, onContinue, onBack, processingMode = 'standard', language }) => {
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sqlLogs, setSqlLogs] = useState<string[]>([]);
  
  useEffect(() => {
    if (!insight) {
      const logs = [
        "INITIALIZING CONNECTION TO SERVERLESS SQL WAREHOUSE...",
        "CLUSTER READY: Databricks Runtime 15.1 (Photon Enabled)",
        "COMPILING SQL PUSH-DOWN EXPRESSION: ai_analyze_sentiment(" + feedbackColumn + ")...",
        "DISTRIBUTING BATCH INFERENCE TASK TO WORKERS...",
        "MOSAIC AI GATEWAY: ANALYZING UNSTRUCTURED DATA...",
        "SUCCESS: 100% OF BATCH PROCESSED IN 0.382s",
        "UPDATING TRANSACTION LOGS...",
        "FETCHING RESULTS FROM DELTA TABLE..."
      ];
      
      let currentLog = 0;
      const interval = setInterval(() => {
        if (currentLog < logs.length) {
          setSqlLogs(prev => [...prev, logs[currentLog]]);
          currentLog++;
        } else {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [insight, feedbackColumn]);

  const allFeedbacks = useMemo(() => {
    return rawData
      .map((d, index) => ({ 
        text: String(d[feedbackColumn] || '').trim(), 
        index, 
        originalData: d 
      }))
      .filter(f => f.text.length > 0);
  }, [rawData, feedbackColumn]);

  const filteredFeedbacks = useMemo(() => {
    return allFeedbacks.filter(f => 
      f.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFeedbacks, searchTerm]);

  const getRatingColor = (rating: string) => {
    switch(rating) {
      case 'Excelente': return 'text-green-400 border-green-500/20 bg-green-500/5';
      case 'Bom': return 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5';
      case 'Médio': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
      case 'Ruim': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
      case 'Horrível': return 'text-red-500 border-red-500/20 bg-red-500/5';
      default: return 'text-slate-400 border-slate-700 bg-slate-800/20';
    }
  };

  // Tenta encontrar um match aproximado no insight da IA
  const findAiResult = (text: string) => {
    if (!insight) return null;
    return insight.samples.find(s => 
      s.text.toLowerCase().includes(text.toLowerCase()) || 
      text.toLowerCase().includes(s.text.toLowerCase())
    );
  };

  if (!insight) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-900 rounded-[48px] border border-slate-800 p-10">
      <div className="w-full max-w-2xl font-mono text-[11px] bg-black p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
           <span className="text-[9px] text-blue-500 font-black animate-pulse uppercase">Cluster Active</span>
        </div>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
           <div className="flex gap-1.5">
             <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
             <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
             <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
           </div>
           <span className="ml-2 text-slate-500 uppercase tracking-tighter">Databricks Mosaic AI SQL Functions</span>
        </div>
        <div className="space-y-1.5 min-h-[220px]">
          {sqlLogs.map((log, i) => (
            <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2">
              <span className="text-slate-700">[{new Date().toLocaleTimeString()}]</span>
              <span className={i === sqlLogs.length - 1 ? 'text-orange-500 animate-pulse font-bold' : 'text-green-500'}>
                {i === sqlLogs.length - 1 ? '> ' : '  '}{log}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             <span className="text-slate-400">Processing Natural Language Batch...</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700 pb-20">
      <div className="bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-white transition-all border border-slate-700">
              <span className="text-[10px] font-black uppercase tracking-widest">← Voltar</span>
            </button>
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3">
                Audit de Inferência NLP
                <span className="bg-orange-600/10 text-orange-500 border border-orange-500/20 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">ENRICHED BY AI</span>
              </h2>
              <p className="text-slate-500 text-sm">Validando os sentimentos extraídos via Databricks Mosaic AI.</p>
            </div>
          </div>
          
          <input 
            type="text" 
            placeholder="Filtrar feedbacks..." 
            className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white outline-none focus:border-orange-500 min-w-[300px]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-slate-950 rounded-[32px] border border-slate-800 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left font-mono">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                <tr>
                  <th className="px-8 py-4 w-16 text-center">Incluir</th>
                  <th className="px-8 py-4">Texto Original</th>
                  <th className="px-8 py-4 text-center text-orange-500">Resultado: Sentimento AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredFeedbacks.map((f) => {
                  const aiMatch = findAiResult(f.text);
                  const isExcluded = excludedIndices.includes(f.index);
                  return (
                    <tr key={f.index} className={`transition-all ${isExcluded ? 'opacity-20 bg-red-950/10' : 'hover:bg-slate-800/30'}`}>
                      <td className="px-8 py-5 text-center">
                         <input 
                           type="checkbox" 
                           checked={!isExcluded} 
                           onChange={() => setExcludedIndices(prev => prev.includes(f.index) ? prev.filter(idx => idx !== f.index) : [...prev, f.index])} 
                           className="w-5 h-5 accent-orange-600 cursor-pointer"
                         />
                      </td>
                      <td className="px-8 py-5 text-xs text-slate-400 italic">"{f.text}"</td>
                      <td className="px-8 py-5 text-center">
                        {aiMatch ? (
                           <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border ${getRatingColor(aiMatch.rating)}`}>
                             {aiMatch.rating.toUpperCase()}
                           </span>
                        ) : (
                           <span className="text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-700 text-slate-600 bg-slate-800/20">
                             MÉDIO (DEFAULT)
                           </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center border-t border-slate-800 pt-10">
          <p className="text-[10px] text-slate-500 max-w-lg leading-relaxed italic">
            💡 Os feedbacks marcados como "Incluir" serão convertidos em colunas numéricas (Score) para o treinamento dos modelos de Machine Learning.
          </p>
          <button onClick={() => onContinue(excludedIndices)} className="bg-orange-600 px-12 py-5 rounded-[24px] font-black text-white hover:bg-orange-500 shadow-2xl uppercase text-sm tracking-widest transition-all">
            Salvar e Iniciar Torneio de Modelos →
          </button>
        </div>
      </div>
    </div>
  );
};
