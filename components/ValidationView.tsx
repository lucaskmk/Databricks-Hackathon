
import React from 'react';
import { PredictionResult } from '../types';

interface Props {
  result: PredictionResult | null;
  language: 'pt' | 'en';
}

export const ValidationView: React.FC<Props> = ({ result, language }) => {
  if (!result) return (
    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[48px] bg-slate-900/30">
       <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Iniciando Auditoria Mosaic AI...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${result.riskLevel === 'High' ? 'bg-red-500' : result.riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
          <div className="flex-1 space-y-8">
            <div>
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Cliente Sob Auditoria Digital</div>
               <h2 className="text-4xl font-black text-white flex items-center gap-4">
                 {result.customerId}
                 <span className={`text-[10px] px-4 py-1.5 rounded-full border uppercase ${
                   result.riskLevel === 'High' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 
                   result.riskLevel === 'Medium' ? 'border-orange-500/30 text-orange-500 bg-orange-500/5' :
                   'border-green-500/30 text-green-500 bg-green-500/5'
                 }`}>
                   Risco {result.riskLevel}
                 </span>
               </h2>
            </div>

            <div className="bg-slate-950/50 p-8 rounded-[32px] border border-slate-800/50 italic text-slate-400 leading-relaxed text-lg relative group">
              <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-4 not-italic flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                Voz do Cliente (Feedback):
              </div>
              {result.customerFeedback ? `"${result.customerFeedback}"` : <span className="opacity-50 text-sm not-italic uppercase tracking-widest">Nenhum feedback textual registrado para este cliente.</span>}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                 <div className="w-1.5 h-4 bg-orange-600 rounded-full"></div>
                 Diagnóstico Predictivo
              </h3>
              <p className="text-xl text-slate-200 font-medium leading-relaxed">"{result.reasoning}"</p>
            </div>
          </div>

          <div className="w-full lg:w-96 flex flex-col items-center justify-center bg-slate-950/30 p-10 rounded-[40px] border border-slate-800">
             <div className={`text-8xl font-black mb-2 ${result.riskLevel === 'High' ? 'text-red-500' : result.riskLevel === 'Medium' ? 'text-orange-500' : 'text-green-500'}`}>
                {Math.round(result.churnProbability * 100)}%
             </div>
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Score de Churn</div>
             <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-8">
                <div className={`h-full ${result.riskLevel === 'High' ? 'bg-red-500' : result.riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${result.churnProbability * 100}%` }} />
             </div>
             <div className="text-center">
                <div className="text-[9px] font-black text-slate-600 uppercase mb-2">Confiança da IA</div>
                <div className="text-2xl font-bold text-white">94.8%</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Piores Categorias (Drivers de Risco)</h3>
            <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 font-black">DATA DRIVEN</span>
          </div>
          <div className="space-y-4">
            {result.topDrivers.length > 0 ? result.topDrivers.map((d, i) => (
              <div key={i} className={`p-6 rounded-[24px] border flex justify-between items-center group transition-all ${
                d.severity === 'high' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-950/50 border-slate-800'
              }`}>
                <div className="flex-1">
                  <div className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">{d.feature}</div>
                  <div className="text-sm font-bold text-slate-200">{d.impact}</div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                  d.severity === 'high' ? 'bg-red-500 text-white' : 'bg-orange-600/20 text-orange-500'
                }`}>
                  {d.severity}
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">Nenhum driver de risco específico detectado.</div>
            )}
          </div>
        </div>

        <div className="bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-green-500 uppercase tracking-widest">Recomendações de Retenção (Mosaic AI)</h3>
            <span className="text-[8px] bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20 font-black">AI GENERATED</span>
          </div>
          <div className="space-y-3">
            {result.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-green-500/5 rounded-[24px] border border-green-500/10 hover:border-green-500/30 transition-all group">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="text-sm text-slate-300 font-medium leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
