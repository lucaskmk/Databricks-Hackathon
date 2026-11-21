
import React, { useState, useEffect } from 'react';
import { CustomerData, CleaningAction } from '../types';
import { suggestDataCleaning } from '../services/geminiService';

interface Props {
  data: CustomerData[];
  onFinishCleaning: (cleanedData: CustomerData[]) => void;
  language: 'pt' | 'en';
}

export const DataCleaningStudio: React.FC<Props> = ({ data, onFinishCleaning, language }) => {
  const [actions, setActions] = useState<CleaningAction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await suggestDataCleaning(data);
        setActions(res);
        setSelectedIds(res.map(a => a.id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [data]);

  const apply = () => {
    let cleaned = JSON.parse(JSON.stringify(data));
    const active = actions.filter(a => selectedIds.includes(a.id));
    
    active.forEach(a => {
      if (a.type === 'replace_values' && a.replacementPairs) {
        const replacementMap = a.replacementPairs.reduce((acc, pair) => {
          acc[pair.from.toLowerCase()] = pair.to;
          return acc;
        }, {} as Record<string, string>);

        cleaned = cleaned.map((row: any) => {
          const rawVal = String(row[a.target] || "").trim();
          const newVal = replacementMap[rawVal.toLowerCase()];
          if (newVal !== undefined) {
            return { ...row, [a.target]: newVal };
          }
          return row;
        });
      } else if (a.type === 'normalize_text') {
        cleaned = cleaned.map((row: any) => ({
          ...row,
          [a.target]: typeof row[a.target] === 'string' ? row[a.target].trim() : row[a.target]
        }));
      } else if (a.type === 'remove_outliers') {
        // Lógica para detectar se o valor individual da célula parece um feedback longo
        cleaned = cleaned.map((row: any) => {
          const val = String(row[a.target] || "");
          // Se o valor tiver mais de 3 palavras ou a IA marcou como outlier, limpamos
          if (val.split(" ").length > 3) {
            return { ...row, [a.target]: null };
          }
          return row;
        });
      }
    });
    
    onFinishCleaning(cleaned);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80">
      <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Mosaic AI: Auditoria de Delta Lake...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white">Auditoria de Qualidade AI</h2>
          <p className="text-slate-500 text-sm">Correções automáticas sugeridas para otimizar o treinamento.</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => onFinishCleaning(data)} className="px-6 py-3 rounded-2xl text-slate-500 font-bold hover:text-white transition-all text-sm uppercase">Ignorar</button>
           <button onClick={apply} className="bg-orange-600 px-8 py-3 rounded-2xl font-black text-white shadow-xl hover:bg-orange-500 transition-all">
             APLICAR E CONTINUAR →
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {actions.length === 0 ? (
          <div className="bg-slate-900/50 p-12 rounded-[32px] border border-slate-800 text-center text-slate-500 font-bold italic">
            Dataset íntegro. Nenhuma anomalia crítica detectada pelo Mosaic AI.
          </div>
        ) : (
          actions.map(a => (
            <div 
              key={a.id}
              onClick={() => setSelectedIds(prev => prev.includes(a.id) ? prev.filter(i => i !== a.id) : [...prev, a.id])}
              className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedIds.includes(a.id) ? 'bg-orange-600/5 border-orange-600/50' : 'bg-slate-900/20 border-slate-800 opacity-60'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-bold">{a.target}</span>
                  <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${a.severity === 'high' ? 'bg-red-500 text-white' : 'bg-slate-950 text-slate-400'}`}>
                    {a.type === 'remove_outliers' ? 'DADO DESLOCADO / LEAKAGE' : a.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{a.description}</p>
                <p className="text-[10px] text-orange-500/70 mt-1 font-bold uppercase italic">Motivo: {a.reason}</p>
                {a.replacementPairs && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.replacementPairs.map((pair, i) => (
                      <span key={i} className="text-[9px] font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        <span className="text-red-500/50 line-through mr-1">{pair.from}</span>
                        <span className="text-green-500">{pair.to}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.includes(a.id) ? 'bg-orange-600 border-orange-600 scale-110 shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'border-slate-800'}`}>
                {selectedIds.includes(a.id) && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
