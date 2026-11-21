
import React, { useRef, useState } from 'react';

interface Props {
  onDataLoaded: (data: any[]) => void;
  label?: string;
  language: 'pt' | 'en';
}

export const FileUpload: React.FC<Props> = ({ onDataLoaded, label, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);

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
          onDataLoaded(parsed);
        } else {
          alert("Arquivo vazio ou formato inválido.");
        }
      } catch (err) {
        console.error("Erro no parser:", err);
        alert("Erro ao processar CSV. Verifique o formato.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith('http')) return alert("Insira uma URL válida (http/https)");
    
    setIsFetching(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Falha ao buscar arquivo na URL.");
      const text = await response.text();
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        onDataLoaded(parsed);
      } else {
        alert("O conteúdo da URL parece não ser um CSV válido.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao acessar a URL. Verifique se o link é público e permite CORS.");
    } finally {
      setIsFetching(false);
    }
  };

  if (label) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-2">
          <button onClick={() => setIsUrlMode(false)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!isUrlMode ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>Arquivo</button>
          <button onClick={() => setIsUrlMode(true)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${isUrlMode ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>URL / Link</button>
        </div>

        {!isUrlMode ? (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-orange-600 px-6 py-3 rounded-2xl text-[10px] font-black text-white hover:bg-orange-500 transition-all uppercase tracking-widest shadow-xl flex items-center gap-3"
          >
            <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileChange} />
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            {label}
          </button>
        ) : (
          <form onSubmit={handleUrlSubmit} className="flex gap-2 w-full max-w-md">
            <input 
              type="text" 
              placeholder="https://raw.githubusercontent.com/.../data.csv" 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-orange-500"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            <button disabled={isFetching} className="bg-orange-600 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase disabled:opacity-50">
              {isFetching ? '...' : 'Ir'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex bg-slate-950 p-1.5 rounded-3xl border border-slate-800 shadow-inner">
        <button 
          onClick={() => setIsUrlMode(false)} 
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!isUrlMode ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}
        >
          📂 Arquivo Local
        </button>
        <button 
          onClick={() => setIsUrlMode(true)} 
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isUrlMode ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'}`}
        >
          🌐 Link Externo (URL)
        </button>
      </div>

      {!isUrlMode ? (
        <div className="w-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-700 rounded-[48px] bg-slate-800/30 hover:bg-slate-800/50 transition-all cursor-pointer group"
             onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept=".csv"
            onChange={handleFileChange}
          />
          <div className="p-6 bg-orange-600 rounded-3xl mb-6 shadow-2xl group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-2xl font-black mb-2 text-white">Carregar Dataset CSV</h3>
          <p className="text-slate-400 text-sm mb-8">Arraste seu arquivo do Databricks ou clique aqui</p>
          <div className="flex gap-4">
            <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase">UTF-8 Suportado</span>
            <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase">Até 10k linhas</span>
          </div>
        </div>
      ) : (
        <div className="w-full p-20 bg-[#101927] border border-slate-800 rounded-[48px] shadow-3xl animate-in zoom-in-95">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2">Importar via URL</h3>
              <p className="text-slate-500 text-sm">Cole o link direto para o arquivo .csv (HTTP/HTTPS)</p>
            </div>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="https://seu-servidor.com/base_clientes.csv" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-orange-500 font-mono text-sm"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <button 
                type="submit"
                disabled={isFetching || !url}
                className="w-full bg-orange-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {isFetching ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
                {isFetching ? 'Processando...' : 'Buscar e Importar Dados'}
              </button>
            </form>
            <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 text-center">
               <p className="text-[10px] text-blue-400 font-bold leading-relaxed">
                 Nota: O servidor de origem deve permitir requisições cross-origin (CORS) ou ser um link público direto.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
