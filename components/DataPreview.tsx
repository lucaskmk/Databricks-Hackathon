
import React, { useState } from 'react';
import { CustomerData } from '../types';

interface Props {
  data: CustomerData[];
  onContinue: () => void;
  onCancel: () => void;
  language: 'pt' | 'en';
}

export const DataPreview: React.FC<Props> = ({ data, onContinue, onCancel, language }) => {
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const columns = Object.keys(data[0] || {});
  
  // Se visibleCount for -1, mostra tudo
  const displayData = visibleCount === -1 ? data : data.slice(0, visibleCount);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="text-orange-600">>>></span> Inspeção de Dados Brutos
          </h2>
          <p className="text-slate-400 text-sm mt-1">Verifique a integridade dos registros antes do treinamento.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1">
            <span className="text-[9px] font-black text-slate-500 px-3 uppercase tracking-widest">Exibir:</span>
            {[15, 50, 100].map(count => (
              <button
                key={count}
                onClick={() => setVisibleCount(count)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${visibleCount === count ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {count}
              </button>
            ))}
            <button
              onClick={() => setVisibleCount(-1)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${visibleCount === -1 ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              TUDO
            </button>
          </div>
          
          <div className="h-10 w-px bg-slate-800 hidden md:block" />
          
          <button onClick={onCancel} className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-all text-sm uppercase">
            CANCELAR
          </button>
          <button onClick={onContinue} className="px-8 py-3 rounded-xl bg-orange-600 text-white font-black shadow-lg shadow-orange-900/40 hover:bg-orange-500 transition-all text-sm uppercase">
            AVANÇAR PARA SETUP →
          </button>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-[32px] border border-slate-700 overflow-hidden shadow-2xl backdrop-blur-md flex flex-col max-h-[60vh]">
        <div className="overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-800">
              <tr>
                <th className="px-4 py-4 w-12 text-center text-slate-700 border-r border-slate-800">#</th>
                {columns.map(col => (
                  <th key={col} className="px-6 py-4 border-r border-slate-800 last:border-0 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-4 text-[10px] text-slate-600 border-r border-slate-800 font-mono text-center bg-slate-900/20 group-hover:text-orange-500">
                    {idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 text-xs text-slate-400 border-r border-slate-800 last:border-0 truncate max-w-[250px]">
                      {row[col] === null || row[col] === undefined || row[col] === "" ? (
                        <span className="text-red-500/50 italic text-[10px]">NULL</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-900/50 flex justify-between items-center border-t border-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Mostrando {displayData.length} de {data.length} linhas
            </span>
            {visibleCount === -1 && (
              <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                Modo Full Scan Ativo
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-600 font-medium">
            Databricks Runtime 13.3 LTS Performance Simulation
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Total de Colunas</div>
            <div className="text-xl font-bold text-white">{columns.length}</div>
          </div>
        </div>
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center text-orange-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Total de Registros</div>
            <div className="text-xl font-bold text-white">{data.length}</div>
          </div>
        </div>
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center text-green-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Status de Leitura</div>
            <div className="text-xl font-bold text-white">Pronto</div>
          </div>
        </div>
      </div>
    </div>
  );
};
