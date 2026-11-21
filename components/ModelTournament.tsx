
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { ModelMetrics } from '../types';

interface Props {
  metrics: ModelMetrics[];
  onSelectModel: (name: string) => void;
  selectedModel: string;
  language: 'pt' | 'en';
}

export const ModelTournament: React.FC<Props> = ({ metrics, onSelectModel, selectedModel, language }) => {
  const [testingProgress, setTestingProgress] = useState(0);
  const [visibleMetrics, setVisibleMetrics] = useState<ModelMetrics[]>([]);

  useEffect(() => {
    if (metrics.length > 0) {
      // Limpa visibleMetrics ao iniciar um novo torneio
      setVisibleMetrics([]);
      let current = 0;
      const interval = setInterval(() => {
        if (current < metrics.length) {
          // Garante que o objeto tenha valores válidos
          const model = metrics[current];
          if (model && model.name) {
            setVisibleMetrics(prev => [...prev, model]);
          }
          current++;
          setTestingProgress((current / metrics.length) * 100);
        } else {
          clearInterval(interval);
        }
      }, 400);
      return () => clearInterval(interval);
    }
  }, [metrics]);

  const safeVal = (val: any): number => {
    if (val === undefined || val === null) return 0;
    // Tira '%' ou outros caracteres se o Gemini retornar strings
    const cleanStr = String(val).replace(/[^\d.]/g, '');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? 0 : n;
  };

  if (metrics.length === 0) return (
    <div className="h-64 flex flex-col items-center justify-center bg-slate-900/50 rounded-[48px] border border-slate-800">
       <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Iniciando Clusters de Treinamento...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {testingProgress < 100 && (
        <div className="bg-[#101927] p-6 rounded-3xl border border-slate-800 mb-8">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Benchmark em Execução: {Math.round(testingProgress)}%</span>
             <span className="text-[10px] text-slate-500 font-mono">Status: Photon Vectorized Engine active</span>
          </div>
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
             <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${testingProgress}%` }}></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleMetrics.map((model, idx) => (
          <div 
            key={`${model.name}-${idx}`}
            onClick={() => onSelectModel(model.name)}
            className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer relative overflow-hidden group animate-in zoom-in-95 ${
              selectedModel === model.name 
              ? 'border-orange-500 bg-orange-600/5 shadow-2xl shadow-orange-900/10' 
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-white">{model.name}</h3>
              {model.suggested && (
                <div className="bg-orange-600 text-white text-[8px] px-3 py-1 rounded-full uppercase font-black border border-orange-500 animate-pulse">
                  MELHOR FIT
                </div>
              )}
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <span>Recall</span>
                  <span className="text-orange-400">{(safeVal(model.recall) * (safeVal(model.recall) <= 1 ? 100 : 1)).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600" style={{ width: `${Math.min(safeVal(model.recall) * (safeVal(model.recall) <= 1 ? 100 : 1), 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <span>AUC Qualidade</span>
                  <span className="text-blue-400">{(safeVal(model.auc) * (safeVal(model.auc) <= 1 ? 100 : 1)).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min(safeVal(model.auc) * (safeVal(model.auc) <= 1 ? 100 : 1), 100)}%` }} />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 italic leading-relaxed line-clamp-3">"{model.description || 'Sem descrição disponível.'}"</p>
          </div>
        ))}
      </div>

      {visibleMetrics.length > 0 && (testingProgress >= 100 || visibleMetrics.length >= 3) && (
        <div className="bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-xl">
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
             Performance Leaderboard
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visibleMetrics} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a111a', border: '1px solid #1e293b', borderRadius: '20px', padding: '20px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  formatter={(value: any) => [`${(safeVal(value) * 100).toFixed(1)}%`]}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="recall" fill="#ea580c" radius={[8, 8, 0, 0]} name="Recall (Foco Churn)" barSize={40} />
                <Bar dataKey="accuracy" fill="#334155" radius={[8, 8, 0, 0]} name="Acurácia Geral" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
