
import React, { useState } from 'react';
import { chatWithData } from '../services/geminiService';
import { CustomerData } from '../types';

interface Props {
  data: CustomerData[];
  language: 'pt' | 'en';
}

export const ChatBot: React.FC<Props> = ({ data, language }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Começa fechado

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithData(userMsg, data);
      setMessages(prev => [...prev, { role: 'bot', text: response || 'I could not process that.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to Databricks AI services.' }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadHistory = () => {
    if (messages.length === 0) return;
    const timestamp = new Date().toLocaleString();
    const content = messages.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `churnsight-log-${new Date().getTime()}.txt`;
    a.click();
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 border-4 border-slate-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5">
      <div className="p-4 bg-orange-600 font-bold flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm tracking-tight text-white">Databricks Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={downloadHistory} className="p-1.5 hover:bg-orange-500 rounded-lg"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
          <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-orange-500 rounded-lg"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm bg-slate-900">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-[10px] text-orange-500 font-bold uppercase animate-pulse">Processando...</div>}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Tire dúvidas sobre os dados..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none text-white"
        />
        <button onClick={handleSend} className="bg-orange-600 p-2.5 rounded-xl hover:bg-orange-500">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  );
};
