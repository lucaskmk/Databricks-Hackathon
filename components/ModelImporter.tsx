
import React, { useState, useRef } from 'react';

interface Props {
  onImport: (name: string, uri: string) => void;
  onFileImport: (data: any[]) => void;
  onCancel: () => void;
  language: 'pt' | 'en';
}

const trans = {
  pt: {
    mlflowMode: "Vincular MLflow (URI)",
    fileMode: "Importar Arquivo (.csv)",
    mlflowTitle: "Conectar MLflow",
    fileTitle: "Importar Auditoria",
    nameLabel: "Apelido do Modelo",
    namePlaceholder: "Ex: Produção V2 - Churn",
    uriLabel: "Model URI ou Endpoint URL",
    uriPlaceholder: "models:/churn_predictor/production",
    mlflowHint: "💡 Ao vincular um modelo externo, o sistema usará o motor de inferência do Databricks via REST API.",
    cancel: "Cancelar",
    confirmMlflow: "Vincular Agora",
    fileAction: "Selecionar CSV Auditado",
    fileHint: "Arraste aqui o arquivo que você baixou na plataforma anteriormente.",
    fileNote: "💡 Se o arquivo contiver colunas de predição (PREDICTION_RISK), o sistema restaurará o Dashboard automaticamente."
  },
  en: {
    mlflowMode: "Link MLflow (URI)",
    fileMode: "Import File (.csv)",
    mlflowTitle: "Connect MLflow",
    fileTitle: "Import Audit",
    nameLabel: "Model Nickname",
    namePlaceholder: "Ex: Production V2 - Churn",
    uriLabel: "Model URI or Endpoint URL",
    uriPlaceholder: "models:/churn_predictor/production",
    mlflowHint: "💡 By linking an external model, the system will use the Databricks inference engine via REST API.",
    cancel: "Cancel",
    confirmMlflow: "Link Now",
    fileAction: "Select Audited CSV",
    fileHint: "Drag and drop the file you previously downloaded from the platform.",
    fileNote: "💡 If the file contains prediction columns (PREDICTION_RISK), the Dashboard will be restored automatically."
  }
};

export const ModelImporter: React.FC<Props> = ({ onImport, onFileImport, onCancel, language }) => {
  const t = trans[language];
  const [mode, setMode] = useState<'mlflow' | 'file'>('mlflow');
  const [name, setName] = useState('');
  const [uri, setUri] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    const splitLine = (line: string) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else cur += char;
      }
      result.push(cur.trim());
      return result;
    };

    const headers = splitLine(lines[0]);
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = splitLine(line);
      const obj: any = {};
      headers.forEach((header, i) => {
        if (header) obj[header] = values[i] || "";
      });
      return obj;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          onFileImport(parsed);
        } else {
          alert(language === 'pt' ? "Arquivo vazio." : "Empty file.");
        }
      } catch (err) {
        alert(language === 'pt' ? "Erro ao processar." : "Error processing.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto bg-[#101927] p-12 rounded-[56px] border border-slate-800 shadow-3xl animate-in zoom-in-95">
      <div className="flex flex-col items-center mb-8">
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button 
            onClick={() => setMode('mlflow')} 
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'mlflow' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            {t.mlflowMode}
          </button>
          <button 
            onClick={() => setMode('file')} 
            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${mode === 'file' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            {t.fileMode}
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${mode === 'mlflow' ? 'bg-blue-600/20' : 'bg-orange-600/20'}`}>
            {mode === 'mlflow' ? (
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            ) : (
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            )}
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {mode === 'mlflow' ? t.mlflowTitle : t.fileTitle}
          </h2>
        </div>
      </div>

      {mode === 'mlflow' ? (
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 ml-2">{t.nameLabel}</label>
            <input 
              type="text" 
              placeholder={t.namePlaceholder} 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 ml-2">{t.uriLabel}</label>
            <input 
              type="text" 
              placeholder={t.uriPlaceholder} 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-mono text-sm" 
              value={uri} 
              onChange={e => setUri(e.target.value)} 
            />
          </div>
          
          <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 mb-4">
             <p className="text-[10px] text-blue-400 font-bold leading-relaxed">
               {t.mlflowHint}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={onCancel} className="bg-slate-800 py-6 rounded-2xl text-slate-400 font-black uppercase tracking-widest hover:text-white transition-all">{t.cancel}</button>
            <button 
              disabled={!name || !uri}
              onClick={() => onImport(name, uri)} 
              className="bg-blue-600 py-6 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl transition-all disabled:opacity-30"
            >
              {t.confirmMlflow}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-12 border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-950/50 flex flex-col items-center justify-center cursor-pointer group hover:border-orange-500/50 transition-all"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileChange} 
            />
            <div className="w-16 h-16 bg-orange-600/10 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <p className="text-white font-black uppercase text-xs tracking-widest">{t.fileAction}</p>
            <p className="text-slate-500 text-[10px] mt-2 text-center">{t.fileHint}</p>
          </div>

          <div className="p-4 bg-orange-600/5 rounded-2xl border border-orange-500/10">
             <p className="text-[10px] text-orange-400 font-bold leading-relaxed">
               {t.fileNote}
             </p>
          </div>

          <button onClick={onCancel} className="w-full bg-slate-800 py-6 rounded-2xl text-slate-400 font-black uppercase tracking-widest hover:text-white transition-all">{t.cancel}</button>
        </div>
      )}
    </div>
  );
};
