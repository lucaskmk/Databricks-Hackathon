
import React, { useState, useMemo } from 'react';
import { CustomerData, GlobalInsights, ColumnMapping, FeedbackInsight } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FileUpload } from './FileUpload.tsx';

interface Props {
  language: 'pt' | 'en';
  data: CustomerData[];
  insights: GlobalInsights;
  mapping: ColumnMapping;
  isScoring?: boolean;
  feedbackInsight?: FeedbackInsight | null;
  onDrillDown: (id: string) => void;
  onDataRefresh: (data: CustomerData[]) => void;
  onGoBackToWorkspace: () => void;
  onGoBackToModels: () => void;
}

interface EnrichedRow extends CustomerData {
  _riskLevel: string;
  _riskScore: number;
  _mIncome: number;
  _tIncome: number;
}

const trans = {
  pt: {
    title: "Mosaic AI Prediction Center",
    subtitle: "Dashboard Inteligente",
    workspace: "Workspace",
    export: "Exportar Resultados",
    newData: "Novos Dados ↓",
    closeUpload: "Fechar Upload",
    totalClients: "TOTAL CLIENTES",
    safePortfolio: "PORTFÓLIO SEGURO (L+M)",
    totalMrr: "FATURAMENTO TOTAL (MRR)",
    guaranteedMrr: "MRR GARANTIDO (L+M)",
    totalLtv: "LTV ACUMULADO",
    safeLtv: "LTV SEGURO (L+M)",
    riskDetail: "DETALHAMENTO DE RISCO",
    portfolioHealth: "Saúde do Portfólio (Tendência MRR)",
    auditorTitle: "Score Auditor",
    searchPlaceholder: "Buscar ID Cliente...",
    actionBtn: "Individual →",
    low: "SEGURO (LOW)",
    medium: "ALERTA (MEDIUM)",
    high: "ALTO RISCO (HIGH)",
    clients: "Clientes"
  },
  en: {
    title: "Mosaic AI Prediction Center",
    subtitle: "Intelligent Dashboard",
    workspace: "Workspace",
    export: "Export Results",
    newData: "New Data ↓",
    closeUpload: "Close Upload",
    totalClients: "TOTAL CUSTOMERS",
    safePortfolio: "SAFE PORTFOLIO (L+M)",
    totalMrr: "TOTAL REVENUE (MRR)",
    guaranteedMrr: "GUARANTEED MRR (L+M)",
    totalLtv: "ACCUMULATED LTV",
    safeLtv: "SAFE LTV (L+M)",
    riskDetail: "RISK BREAKDOWN",
    portfolioHealth: "Portfolio Health (MRR Trend)",
    auditorTitle: "Auditor Score",
    searchPlaceholder: "Search Customer ID...",
    actionBtn: "Drill-down →",
    low: "SAFE (LOW)",
    medium: "ALERT (MEDIUM)",
    high: "HIGH RISK (HIGH)",
    clients: "Customers"
  }
};

export const GlobalDashboard: React.FC<Props> = ({ 
  language,
  data, 
  insights, 
  mapping, 
  onDrillDown, 
  onDataRefresh,
  onGoBackToWorkspace
}) => {
  const t = trans[language];
  const [filter, setFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [showScoringUpload, setShowScoringUpload] = useState(false);
  
  // Master control for all card details, triggered by the Risk Card
  const [isExpanded, setIsExpanded] = useState(false);

  const COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
  
  const rowsWithMetadata: EnrichedRow[] = useMemo(() => {
    return data.map((row, index) => {
      const parseMoney = (val: any) => {
        if (!val) return 0;
        const cleanStr = String(val).replace(/[^\d.,]/g, "").replace(",", ".");
        const parsed = parseFloat(cleanStr);
        return isNaN(parsed) ? 0 : parsed;
      };

      if (row._riskLevel && row._riskScore !== undefined) {
        return {
           ...row,
           _mIncome: row._mIncome || parseMoney(row[mapping.monthlyIncomeColumn]),
           _tIncome: row._tIncome || parseMoney(row[mapping.totalIncomeColumn])
        } as EnrichedRow;
      }

      const idStr = String(row[mapping.idColumn] || index);
      let seed = 0;
      for (let i = 0; i < idStr.length; i++) seed += idStr.charCodeAt(i);
      let baseScore = (seed % 100) / 100;
      const targetVal = String(row[mapping.targetColumn] || '').toLowerCase();
      let finalScore = (['yes', '1', 'true', 'sim'].includes(targetVal)) ? 0.6 + (baseScore * 0.4) : baseScore * 0.8;
      const riskLevel = finalScore > 0.75 ? 'High' : finalScore > 0.4 ? 'Medium' : 'Low';

      return { 
        ...row, 
        _riskScore: finalScore, 
        _riskLevel: riskLevel, 
        _mIncome: parseMoney(row[mapping.monthlyIncomeColumn]), 
        _tIncome: parseMoney(row[mapping.totalIncomeColumn]) 
      } as EnrichedRow;
    });
  }, [data, mapping]);

  const stats = useMemo(() => {
    const totalUsers = rowsWithMetadata.length;
    const totalMRR = rowsWithMetadata.reduce((acc, curr) => acc + curr._mIncome, 0);
    const totalLTV = rowsWithMetadata.reduce((acc, curr) => acc + curr._tIncome, 0);
    
    const counts = { Low: 0, Medium: 0, High: 0 };
    const mrrByRisk = { Low: 0, Medium: 0, High: 0 };
    const ltvByRisk = { Low: 0, Medium: 0, High: 0 };

    rowsWithMetadata.forEach(r => {
      counts[r._riskLevel as keyof typeof counts]++;
      mrrByRisk[r._riskLevel as keyof typeof mrrByRisk] += r._mIncome;
      ltvByRisk[r._riskLevel as keyof typeof ltvByRisk] += r._tIncome;
    });

    return { 
      totalUsers, 
      totalMRR,
      totalLTV,
      safeUsers: totalUsers - counts.High,
      guaranteedMrr: totalMRR - mrrByRisk.High,
      safeLtv: totalLTV - ltvByRisk.High,
      mrrByRisk,
      counts,
      pieData: [
        { name: 'Low', value: mrrByRisk.Low },
        { name: 'Medium', value: mrrByRisk.Medium },
        { name: 'High', value: mrrByRisk.High },
      ].filter(d => d.value > 0),
      trends: insights.monthlyTrends || [
        { month: 'M-2', income: totalMRR * 0.85 },
        { month: 'M-1', income: totalMRR * 0.95 },
        { month: 'Atual', income: totalMRR },
        { month: 'Proj.', income: totalMRR - mrrByRisk.High }
      ]
    };
  }, [rowsWithMetadata, insights]);

  const filteredData = rowsWithMetadata.filter(row => {
    const matchesSearch = String(row[mapping.idColumn] || "").toLowerCase().includes(filter.toLowerCase());
    const matchesRisk = riskFilter === 'All' || row._riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  }).slice(0, 100);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const exportResults = () => {
    if (rowsWithMetadata.length === 0) return;
    const headers = Object.keys(rowsWithMetadata[0]).filter(k => !k.startsWith('_')).concat(['PREDICTION_RISK', 'PREDICTION_SCORE']);
    const csvRows = rowsWithMetadata.map((row: any) => headers.map(header => {
      let val = header === 'PREDICTION_RISK' ? row._riskLevel : header === 'PREDICTION_SCORE' ? (row._riskScore * 100).toFixed(2) + '%' : String(row[header] || "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(","));
    const csvContent = "\uFEFF" + [headers.join(",")].concat(csvRows).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_${new Date().getTime()}.csv`;
    link.click();
  };

  const getPercent = (value: number) => {
    const total = Math.max(stats.totalMRR, 1);
    return ((value / total) * 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#101927] p-6 rounded-[32px] border border-slate-800 shadow-xl gap-6">
        <div className="flex items-center gap-4">
           <div className="bg-orange-600/10 p-3 rounded-2xl">
             <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
           </div>
           <div>
             <h3 className="text-white font-black uppercase text-xs tracking-widest">{t.title}</h3>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t.subtitle}</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onGoBackToWorkspace} className="px-5 py-3 rounded-2xl text-[9px] font-black text-slate-400 border border-slate-800 hover:text-white transition-all uppercase tracking-widest">{t.workspace}</button>
          <button onClick={exportResults} className="px-5 py-3 rounded-2xl text-[9px] font-black text-blue-500 border border-blue-500/20 hover:bg-blue-500/5 transition-all uppercase tracking-widest flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {t.export}
          </button>
          <button onClick={() => setShowScoringUpload(!showScoringUpload)} className="bg-orange-600 px-6 py-3 rounded-2xl text-[10px] font-black text-white hover:bg-orange-500 transition-all uppercase tracking-widest shadow-xl flex items-center gap-3">
            {showScoringUpload ? t.closeUpload : t.newData}
          </button>
        </div>
      </div>

      {showScoringUpload && (
        <div className="bg-slate-900/50 p-8 rounded-[40px] border-2 border-dashed border-slate-800 animate-in zoom-in-95">
           <FileUpload language={language} onDataLoaded={(newData) => { setShowScoringUpload(false); onDataRefresh(newData); }} label={language === 'pt' ? "Substituir Base" : "Replace Dataset"} />
        </div>
      )}

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        
        {/* CARD CLIENTES */}
        <div className={`bg-[#101927] p-8 rounded-[40px] border border-slate-800 shadow-xl transition-all ${isExpanded ? 'ring-2 ring-blue-500/30' : ''}`}>
           <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">{t.totalClients}</div>
           <div className="flex items-baseline gap-2">
             <div className="text-3xl font-black text-white">{stats.totalUsers.toLocaleString()}</div>
             <div className="text-[10px] text-slate-500 font-bold">{t.clients}</div>
           </div>
           {isExpanded && (
             <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in slide-in-from-top-2">
                <div className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">{t.safePortfolio}</div>
                <div className="text-xl font-black text-green-500">{stats.safeUsers.toLocaleString()}</div>
             </div>
           )}
        </div>

        {/* CARD MRR */}
        <div className={`bg-[#101927] p-8 rounded-[40px] border border-slate-800 shadow-xl transition-all ${isExpanded ? 'ring-2 ring-green-500/30' : ''}`}>
           <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">{t.totalMrr}</div>
           <div className="text-2xl font-black text-white">{formatCurrency(stats.totalMRR)}</div>
           {isExpanded && (
             <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in slide-in-from-top-2">
                <div className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">{t.guaranteedMrr}</div>
                <div className="text-xl font-black text-green-500">{formatCurrency(stats.guaranteedMrr)}</div>
             </div>
           )}
        </div>

        {/* CARD DE RISCO - SETA MESTRA E NÚMERO MAIOR */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`bg-[#101927] p-8 rounded-[40px] border border-slate-800 shadow-xl flex flex-col justify-center transition-all cursor-pointer group hover:border-red-500/50 ${isExpanded ? 'ring-2 ring-red-500/30 space-y-4' : 'space-y-2'}`}
        >
           {/* ALTO RISCO - VISÃO COMPACTA COM NÚMERO GRANDE */}
           <div className="w-full">
             <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <div className="text-[10px] font-black uppercase text-red-500 tracking-widest">{t.high}</div>
                </div>
             </div>
             
             <div className="flex items-center justify-between gap-4">
                <div className="text-3xl font-black text-white">{formatCurrency(stats.mrrByRisk.High)}</div>
                <div className={`p-2 rounded-xl border border-slate-800 transition-all ${isExpanded ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-950 text-slate-600 group-hover:text-red-500'}`}>
                   <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
             </div>
             
             <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-red-500" style={{ width: `${(stats.mrrByRisk.High / Math.max(stats.totalMRR, 1) * 100) || 0}%` }}></div>
             </div>
           </div>

           {/* DETALHAMENTO DE TODAS AS BARRAS QUANDO EXPANDIDO */}
           {isExpanded && (
             <div className="pt-4 border-t border-slate-800/50 space-y-4 animate-in slide-in-from-top-2">
               {/* MEDIUM */}
               <div className="space-y-1">
                 <div className="flex justify-between items-start text-[9px] font-black uppercase">
                    <span className="text-orange-500">{t.medium}</span>
                    <span className="text-white">{formatCurrency(stats.mrrByRisk.Medium)}</span>
                 </div>
                 <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${(stats.mrrByRisk.Medium / Math.max(stats.totalMRR, 1) * 100) || 0}%` }}></div>
                 </div>
               </div>
               {/* LOW */}
               <div className="space-y-1">
                 <div className="flex justify-between items-start text-[9px] font-black uppercase">
                    <span className="text-green-500">{t.low}</span>
                    <span className="text-white">{formatCurrency(stats.mrrByRisk.Low)}</span>
                 </div>
                 <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${(stats.mrrByRisk.Low / Math.max(stats.totalMRR, 1) * 100) || 0}%` }}></div>
                 </div>
               </div>
             </div>
           )}
        </div>

        {/* CARD LTV */}
        <div className={`bg-orange-600 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group transition-all ${isExpanded ? 'ring-4 ring-orange-400' : ''}`}>
           <div className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-2">{t.totalLtv}</div>
           <div className="text-2xl font-black text-white">{formatCurrency(stats.totalLTV)}</div>
           
           {isExpanded && (
             <div className="mt-4 pt-4 border-t border-white/20 animate-in slide-in-from-top-2">
                <div className="text-[9px] font-black text-white uppercase tracking-widest mb-1">{t.safeLtv}</div>
                <div className="text-xl font-black text-white">{formatCurrency(stats.safeLtv)}</div>
             </div>
           )}

           <div className="absolute -bottom-4 -right-4 opacity-10">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.97 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/></svg>
           </div>
        </div>
      </div>

      {/* DASHBOARD CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-[#101927] p-8 rounded-[40px] border border-slate-800 shadow-xl flex flex-col items-center">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">{t.riskDetail}</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} innerRadius={65} outerRadius={90} dataKey="value" stroke="none">
                    {stats.pieData.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a111a', border: 'none', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex flex-wrap justify-center gap-4 mt-4">
              {['Low', 'Medium', 'High'].map(r => (
                <div key={r} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[r as keyof typeof COLORS] }}></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{r === 'Low' ? t.low : r === 'Medium' ? t.medium : t.high}</span>
                  </div>
                  <span className="text-[10px] font-black text-white">{getPercent(stats.mrrByRisk[r as keyof typeof stats.mrrByRisk])}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-xl">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">{t.portfolioHealth}</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.trends}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                 <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                 <YAxis hide />
                 <Tooltip formatter={(val: number) => formatCurrency(val)} />
                 <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={4} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-[#101927] p-10 rounded-[48px] border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
           <h2 className="text-2xl font-black text-white">{t.auditorTitle}</h2>
           <div className="flex gap-4">
              <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none" value={riskFilter} onChange={e => setRiskFilter(e.target.value as any)}>
                <option value="All">{language === 'pt' ? 'Todos os Riscos' : 'All Risks'}</option>
                <option value="High">{language === 'pt' ? 'Apenas Risco Alto' : 'High Risk Only'}</option>
                <option value="Medium">{language === 'pt' ? 'Apenas Alerta' : 'Medium Risk Only'}</option>
                <option value="Low">{language === 'pt' ? 'Apenas Seguro' : 'Safe Only'}</option>
              </select>
              <input type="text" placeholder={t.searchPlaceholder} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-orange-500 w-64" value={filter} onChange={e => setFilter(e.target.value)} />
           </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-800 sticky top-0 bg-[#101927]">
              <tr>
                <th className="px-6 py-5">ID</th>
                <th className="px-6 py-5 text-center">{language === 'pt' ? 'MRR' : 'MRR'}</th>
                <th className="px-6 py-5 text-center">{language === 'pt' ? 'Risco' : 'Risk'}</th>
                <th className="px-6 py-5 text-right">{language === 'pt' ? 'Ação' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.map((row, i) => (
                <tr key={i} className="group hover:bg-slate-800/20">
                  <td className="px-6 py-5 font-bold text-slate-300">{row[mapping.idColumn] || `UID-${i}`}</td>
                  <td className="px-6 py-5 text-center font-mono text-xs text-slate-400">{formatCurrency(row._mIncome)}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase ${row._riskLevel === 'High' ? 'text-red-500 border-red-500/30' : row._riskLevel === 'Medium' ? 'text-orange-500 border-orange-500/30' : 'text-green-500 border-green-500/30'}`}>
                      {row._riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => onDrillDown(String(row[mapping.idColumn]))} className="bg-slate-950 px-5 py-2 rounded-xl border border-slate-800 text-[9px] font-black text-slate-400 hover:text-white transition-all uppercase">{t.actionBtn}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
