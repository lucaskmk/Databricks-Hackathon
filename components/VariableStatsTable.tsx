
import React from 'react';
import { VariableStats } from '../types';

interface Props {
  stats: VariableStats[];
  selectedFeatures: string[];
  onToggle: (v: string) => void;
  onDrillDown: (v: string) => void;
}

export const VariableStatsTable: React.FC<Props> = ({ stats, selectedFeatures, onToggle, onDrillDown }) => {
  return (
    <div className="bg-slate-800/30 rounded-[32px] border border-slate-700 overflow-hidden shadow-2xl backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-black">
          <tr>
            <th className="px-8 py-6">Variável</th>
            <th className="px-8 py-6 text-center">Tipo</th>
            <th className="px-8 py-6 text-center">R² (Sinal)</th>
            <th className="px-8 py-6 text-center">Status AI</th>
            <th className="px-8 py-6 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {stats.sort((a,b) => b.explainingPower - a.explainingPower).map((s) => {
            const isLowSignal = s.explainingPower < 0.005;
            const isVeryLow = s.explainingPower < 0.002;
            
            return (
              <tr key={s.variable} className={`group hover:bg-slate-800/40 transition-colors ${!selectedFeatures.includes(s.variable) ? 'opacity-40 grayscale' : ''}`}>
                <td className="px-8 py-5 font-bold text-white">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      {s.variable}
                      {isVeryLow && <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">RUÍDO?</span>}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">P-Value: {s.pValue.toFixed(4)}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase border ${s.type === 'numeric' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400'}`}>
                    {s.type}
                  </span>
                </td>
                <td className="px-8 py-5 text-center font-mono font-bold">
                  <div className="flex flex-col items-center">
                    <span className={isLowSignal ? 'text-slate-500' : 'text-orange-400'}>
                      {(s.explainingPower * 100).toFixed(2)}%
                    </span>
                    <div className="w-12 h-1 bg-slate-900 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${isLowSignal ? 'bg-slate-700' : 'bg-orange-500'}`} 
                        style={{ width: `${Math.min(s.explainingPower * 1000, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${s.relevant ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {s.relevant ? 'MANTIDO' : 'DESCARTAR'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button 
                    onClick={() => onDrillDown(s.variable)}
                    className="px-3 py-2 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black"
                  >
                    VER GRÁFICOS 📊
                  </button>
                  <button 
                    onClick={() => onToggle(s.variable)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
                      selectedFeatures.includes(s.variable) 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                    }`}
                  >
                    {selectedFeatures.includes(s.variable) ? 'REMOVER' : 'ADICIONAR'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="p-6 bg-slate-900/50 text-[10px] text-slate-500 italic space-y-1">
        <p>* R² (Pseudo-R2): Mede quanto da variação do Churn é explicada apenas por esta variável.</p>
        <p className="text-orange-500/60 font-bold">Dica Técnica: Variáveis com R² abaixo de 0.50% raramente ajudam o modelo e podem causar overfitting (ruído).</p>
      </div>
    </div>
  );
};
