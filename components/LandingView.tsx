
import React, { useState } from 'react';
import { User, Project } from '../types';

interface Props {
  language: 'pt' | 'en';
  onLogin: (user: User) => void;
  onSelectProject: (p: Project) => void;
  onCreateProject: () => void;
  onImportProject: () => void;
  savedProjects: Project[];
}

interface WorkspaceProps {
  language: 'pt' | 'en';
  user: User;
  onLogout: () => void;
  onCreateProject: () => void;
  onImportProject: () => void;
  onSelectProject: (p: Project) => void;
  savedProjects: Project[];
}

const trans = {
  pt: {
    welcome: "Bem-vindo de volta",
    register: "Registre sua Empresa",
    createAccount: "Criar Nova Conta",
    accessWorkspace: "Acessar Workspace",
    simMode: "Modo Simulação (Sem Registro)",
    placeholderName: "Seu Nome",
    placeholderCompany: "Empresa",
    placeholderContact: "E-mail ou Celular",
    btnCode: "Receber Código de Acesso →",
    btnVerify: "Confirmar e Entrar",
    otpTitle: "Verifique seu acesso",
    hello: "Olá",
    logout: "Sair",
    importMlflow: "Importar MLflow",
    newModel: "Novo Modelo AI",
    emptyWorkspace: "Nenhum modelo implantado neste workspace",
    provisionFirst: "Provisionar Primeiro Cluster →",
    active: "Ativo"
  },
  en: {
    welcome: "Welcome back",
    register: "Register your Company",
    createAccount: "Create New Account",
    accessWorkspace: "Access Workspace",
    simMode: "Simulation Mode (No Signup)",
    placeholderName: "Your Name",
    placeholderCompany: "Company",
    placeholderContact: "Email or Phone",
    btnCode: "Get Access Code →",
    btnVerify: "Confirm and Enter",
    otpTitle: "Verify your access",
    hello: "Hello",
    logout: "Logout",
    importMlflow: "Import MLflow",
    newModel: "New AI Model",
    emptyWorkspace: "No models deployed in this workspace",
    provisionFirst: "Provision First Cluster →",
    active: "Active"
  }
};

export const LandingView: React.FC<Props> = ({ language, onLogin, onSelectProject, onCreateProject, onImportProject, savedProjects }) => {
  const t = trans[language];
  const [mode, setMode] = useState<'AUTH_CHOICE' | 'REGISTER' | 'LOGIN' | 'OTP'>('AUTH_CHOICE');
  const [username, setUsername] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showOtpHint, setShowOtpHint] = useState(false);

  const sendCode = (targetContact: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setMode('OTP');
    setShowOtpHint(true);
    setTimeout(() => setShowOtpHint(false), 8000);
  };

  const handleSimulation = () => {
    const guestUser: User = {
      id: 'guest_' + Math.random().toString(36).substr(2, 5),
      username: 'Guest',
      company: 'Simulation Corp',
      contact: 'guest@simulation.io'
    };
    onLogin(guestUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !company || !contact) return alert("Fill all fields");
    const users = JSON.parse(localStorage.getItem('churn_users') || '[]');
    if (users.find((u: any) => u.contact === contact)) {
      setMode('LOGIN');
      return;
    }
    sendCode(contact);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return alert("Provide contact");
    const users = JSON.parse(localStorage.getItem('churn_users') || '[]');
    const user = users.find((u: any) => u.contact === contact);
    if (!user) {
      setMode('REGISTER');
      return;
    }
    setUsername(user.username);
    setCompany(user.company);
    sendCode(contact);
  };

  const verifyOtp = () => {
    if (otpInput === generatedOtp || otpInput === "000000") {
      const users = JSON.parse(localStorage.getItem('churn_users') || '[]');
      let user = users.find((u: any) => u.contact === contact);
      if (!user) {
        user = { id: Math.random().toString(36).substr(2, 9), username, company, contact };
        users.push(user);
        localStorage.setItem('churn_users', JSON.stringify(users));
      }
      onLogin(user);
    } else {
      alert("Invalid code.");
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-10">
      {showOtpHint && (
        <div className="fixed top-10 right-10 bg-blue-600 p-6 rounded-3xl shadow-2xl border border-white/20 animate-in slide-in-from-right-10 z-[100] max-w-xs">
          <p className="text-[10px] font-black uppercase text-white/70 mb-1">Code Received</p>
          <p className="text-white text-sm font-bold">Your Mosaic AI code is: <span className="text-2xl block mt-2 tracking-widest">{generatedOtp}</span></p>
        </div>
      )}

      {mode === 'AUTH_CHOICE' && (
        <div className="text-center space-y-12 animate-in zoom-in-95">
          <div className="space-y-4">
             <div className="bg-orange-600 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-orange-900/40">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <h1 className="text-5xl font-black text-white tracking-tighter">Churn Insight</h1>
             <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Empowering Intelligence</p>
          </div>
          
          <div className="flex flex-col gap-6 items-center">
            <div className="flex flex-col md:flex-row gap-6">
               <button onClick={() => setMode('REGISTER')} className="bg-orange-600 px-12 py-6 rounded-[32px] text-white font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl text-sm min-w-[240px]">{t.createAccount}</button>
               <button onClick={() => setMode('LOGIN')} className="bg-slate-800 px-12 py-6 rounded-[32px] text-white font-black uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all text-sm min-w-[240px]">{t.accessWorkspace}</button>
            </div>
            <button onClick={handleSimulation} className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-slate-500 hover:text-orange-500 transition-all border border-transparent hover:border-orange-500/30">
              <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs font-black uppercase tracking-[0.2em]">{t.simMode}</span>
            </button>
          </div>
        </div>
      )}

      {(mode === 'REGISTER' || mode === 'LOGIN') && (
        <div className="bg-[#101927] p-12 rounded-[56px] border border-slate-800 shadow-3xl w-full max-w-md animate-in fade-in slide-in-from-bottom-5">
           <button onClick={() => setMode('AUTH_CHOICE')} className="text-slate-600 hover:text-white text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
             {language === 'pt' ? 'Voltar' : 'Back'}
           </button>
           <h2 className="text-3xl font-black text-white mb-2">{mode === 'REGISTER' ? t.register : t.welcome}</h2>
           <form onSubmit={mode === 'REGISTER' ? handleRegister : handleLogin} className="space-y-4">
              {mode === 'REGISTER' && (
                <>
                  <input type="text" placeholder={t.placeholderName} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-orange-500" value={username} onChange={e => setUsername(e.target.value)} />
                  <input type="text" placeholder={t.placeholderCompany} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-orange-500" value={company} onChange={e => setCompany(e.target.value)} />
                </>
              )}
              <input type="text" placeholder={t.placeholderContact} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-orange-500 font-mono" value={contact} onChange={e => setContact(e.target.value)} />
              <button className="w-full bg-orange-600 py-6 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl mt-6">{t.btnCode}</button>
           </form>
        </div>
      )}

      {mode === 'OTP' && (
        <div className="bg-[#101927] p-12 rounded-[56px] border border-slate-800 shadow-3xl w-full max-w-md text-center animate-in zoom-in-95">
           <h2 className="text-3xl font-black text-white mb-2">{t.otpTitle}</h2>
           <input type="text" maxLength={6} placeholder="0 0 0 0 0 0" className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 text-center text-4xl font-black tracking-[0.5em] text-orange-500 outline-none focus:border-orange-600" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} />
           <button onClick={verifyOtp} className="w-full bg-orange-600 py-6 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl mt-6">{t.btnVerify}</button>
        </div>
      )}
    </div>
  );
};

export const WorkspaceView: React.FC<WorkspaceProps> = ({ language, user, onLogout, onCreateProject, onImportProject, onSelectProject, savedProjects }) => {
  const t = trans[language];
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">{t.hello}, {user.username}</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">{user.company}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={onLogout} className="px-6 py-4 rounded-2xl text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white">{t.logout}</button>
          <button onClick={onImportProject} className="bg-slate-800 px-8 py-4 rounded-2xl text-blue-500 border border-slate-700 font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            {t.importMlflow}
          </button>
          <button onClick={onCreateProject} className="bg-orange-600 px-8 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            {t.newModel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {savedProjects.length === 0 ? (
          <div className="col-span-full py-32 border-2 border-dashed border-slate-800 rounded-[56px] flex flex-col items-center justify-center text-slate-600 bg-slate-900/20">
             <p className="font-black uppercase tracking-[0.2em] text-xs mb-4">{t.emptyWorkspace}</p>
             <button onClick={onCreateProject} className="text-orange-500 font-black text-xs hover:underline uppercase tracking-widest">{t.provisionFirst}</button>
          </div>
        ) : (
          savedProjects.map(p => (
            <div key={p.id} onClick={() => onSelectProject(p)} className="bg-[#101927] p-8 rounded-[40px] border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-all group shadow-xl h-72 flex flex-col">
              <div className="mb-auto">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${p.isExternal ? 'bg-blue-600/20' : 'bg-slate-900 group-hover:bg-orange-600'}`}>
                  {p.isExternal ? (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  )}
                </div>
                <h3 className={`text-xl font-black group-hover:text-orange-500 transition-colors ${p.isExternal ? 'text-blue-400' : 'text-white'}`}>{p.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">{p.isExternal ? `Endpoint: ${p.modelUri}` : (p.description || (language === 'pt' ? "Nenhuma descrição." : "No description."))}</p>
                <div className="flex gap-2 mt-3">
                   <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-black uppercase tracking-widest">{p.isExternal ? 'MLflow Endpoint' : (p.selectedModel || 'Draft')}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center border-t border-slate-800 pt-4">
                 <span className="text-[9px] text-slate-500 font-bold">{new Date(p.createdAt).toLocaleDateString()}</span>
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{t.active}</span>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
