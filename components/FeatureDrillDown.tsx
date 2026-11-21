
import React, { useMemo } from 'react';
import { CustomerData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, Cell } from 'recharts';

interface Props {
  feature: string;
  target: string;
  data: CustomerData[];
  onClose: () => void;
}

export const FeatureDrillDown: React.FC<Props> = ({ feature, target, data, onClose }) => {
  const analysis = useMemo(() => {
    const isChurn = (row: any) => {
      const val = String(row[target] || '').trim().toLowerCase();
      return ['yes', '1', 'true', 'sim', 't', 'y'].includes(val);
    };

    const totalChurns = data.filter(isChurn).length;
    const values = data.map(d => d[feature]).filter(v => v !== undefined && v !== null && v !== "");
    
    const numericValues = values.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
    // Identifica se é numérico baseado na quantidade de valores únicos e na natureza dos dados
    const isNumeric = numericValues.length > (values.length * 0.8) && new Set(numericValues).size > 15;

    if (isNumeric) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const binCount = 10; // Aumentado para 10 para maior fluidez no gráfico de área
      const step = (max - min) / binCount;
      
      const bins = Array.from({ length: binCount }, (_, i) => {
        const start = min + (i * step);
        const end = start + step;
        const subset = data.filter(d => {
          const val = parseFloat(String(d[feature]));
          return val >= start && (i === binCount - 1 ? val <= end : val < end);
        });
        const churns = subset.filter(isChurn).length;
        
        return {
          category: `${start.toFixed(0)} - ${end.toFixed(0)}`,
          volume: subset.length,
          churns: churns,
          churnRate: subset.length > 0 ? Number(((churns / subset.length) * 100).toFixed(2)) : 0,
          impact: totalChurns > 0 ? Number(((churns / totalChurns) * 100).toFixed(1)) : 0
        };
      });

      return { isNumeric: true, chartData: bins, tableData: bins };
    } else {
      const counts: Record<string, { total: number; churn: number }> = {};
      data.forEach(row => {
        let val = String(row[feature] === undefined || row[feature] === null ? 'N/A' : row[feature]).trim();
        if (!counts[val]) counts[val] = { total: 0, churn: 0 };
        counts[val].total++;
        if (isChurn(row)) counts[val].churn++;
      });

      const results = Object.keys(counts).map(key => ({
        category: key,
        volume: counts[key].total,
        churns: counts[key].churn,
        churnRate: Number(((counts[key].churn / counts[key].total) * 100).toFixed(2)),
        impact: totalChurns > 0 ? Number(((counts[key].churn / totalChurns) * 100).toFixed(1)) : 0
      })).sort((a, b) => b.volume - a.volume);

      return { 
        isNumeric: false, 
        chartData: results.slice(0, 8), 
        tableData: results.slice(0, 20) 
      };
    }
  }, [data, feature, target]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-2xl">
          <p className="text-white font-black text-[10px] mb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-1">
            <p className="text-blue-400 text-[10px] font-bold">VOL: {payload[0]?.value}</p>
            {payload[1] && <p className="text-orange-500 text-[10px] font-bold">CHURN: {payload[1].value}%</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[250] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#0a111a] border border-slate-800 w-full max-w-6xl rounded-[64px] shadow-3xl overflow-hidden flex flex-col h-[90vh]">
        
        <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="bg-orange-600 px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                {analysis.isNumeric ? 'Análise Numérica (Distribuição)' : 'Distribuição Categórica'}
              </span>
              <span className="text-slate-500 text-[10px] font-mono">Variável: {feature}</span>
            </div>
            <h2 className="text-4xl font-black text-white">
              Exploração de Atributos
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="group px-8 py-4 bg-slate-800 hover:bg-red-600 text-white rounded-[24px] transition-all flex items-center gap-3 border border-slate-700 hover:border-red-500"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Sair dos Detalhes</span>
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/30 p-8 rounded-[40px] border border-slate-800">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Distribuição de Volume</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  {analysis.isNumeric ? (
                    <ComposedChart data={analysis.chartData}>
                      <defs>
                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVol)" strokeWidth={3} />
                    </ComposedChart>
                  ) : (
                    <BarChart data={analysis.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="volume" radius={[6, 6, 0, 0]} barSize={25}>
                        {analysis.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/30 p-8 rounded-[40px] border border-slate-800">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-8">Incidência de Churn (%)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysis.chartData}>
                    <defs>
                      <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    {analysis.isNumeric ? (
                      <Area type="monotone" dataKey="churnRate" stroke="#f97316" fillOpacity={1} fill="url(#colorChurn)" strokeWidth={3} />
                    ) : (
                      <Bar dataKey="churnRate" fill="#f97316" radius={[6, 6, 0, 0]} barSize={25} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-black/40 rounded-[48px] border border-slate-800 overflow-hidden shadow-inner p-2">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="text-slate-500 uppercase border-b border-slate-800/50">
                <tr>
                  <th className="px-10 py-6 tracking-widest">Faixa/Categoria</th>
                  <th className="px-10 py-6 text-right tracking-widest">Volume</th>
                  <th className="px-10 py-6 text-right text-orange-500 tracking-widest">Churn_Rate_%</th>
                  <th className="px-10 py-6 text-right text-blue-500 tracking-widest">Impacto_%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {analysis.tableData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="px-10 py-6 font-black text-slate-200 group-hover:text-white transition-colors">{row.category}</td>
                    <td className="px-10 py-6 text-right text-slate-500 font-bold">{row.volume.toLocaleString()}</td>
                    <td className="px-10 py-6 text-right text-orange-400 font-black text-sm">
                      <div className="flex flex-col items-end">
                        <span>{row.churnRate}%</span>
                        <div className="w-16 h-1 bg-slate-900 rounded-full mt-1">
                          <div className="h-full bg-orange-600" style={{ width: `${Math.min(row.churnRate, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right text-blue-400 font-black text-sm">{row.impact}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
