
import React, { useState, useMemo, useEffect } from 'react';
import { LandingView, WorkspaceView } from './components/LandingView.tsx';
import { FileUpload } from './components/FileUpload.tsx';
import { ChatBot } from './components/ChatBot.tsx';
import { ModelTournament } from './components/ModelTournament.tsx';
import { ModelImporter } from './components/ModelImporter.tsx';
import { ValidationView } from './components/ValidationView.tsx';
import { DataPreview } from './components/DataPreview.tsx';
import { DataCleaningStudio } from './components/DataCleaningStudio.tsx';
import { GlobalDashboard } from './components/GlobalDashboard.tsx';
import { NLPVerificationView } from './components/NLPVerificationView.tsx';
import { InsightsView } from './components/InsightsView.tsx';
import { CustomerData, ColumnMapping, Step, PredictionResult, ModelMetrics, User, Project, GlobalInsights, FeedbackInsight } from './types.ts';
import { getPredictionInsight, simulateModelTournament, getGlobalInsights, callDatabricksAIFunction } from './services/geminiService.ts';

// Dicionário de Traduções simplificado para a estrutura principal
const translations = {
  pt: {
    workspace: "Workspace",
    newExperiment: "Novo Experimento",
    expName: "Nome do Experimento",
    expDesc: "Descrição / Objetivo",
    continue: "Continuar para Upload →",
    loading: "Processando...",
    trainPhoton: "Otimizando Hiperparâmetros (Photon Engine)...",
    deploying: "Provisionando Cluster e Publicando Modelo...",
    scoring: "Executando Inferência em Lote (Scoring)...",
    insights: "Gerando Insights Globais...",
    auditing: "Auditando cliente",
    logout: "Sair",
    back: "Voltar",
    advance: "Avançar",
    saveAndDeploy: "Salvar e Publicar Modelo →"
  },
  en: {
    workspace: "Workspace",
    newExperiment: "New Experiment",
    expName: "Experiment Name",
    expDesc: "Description / Objective",
    continue: "Continue to Upload →",
    loading: "Processing...",
    trainPhoton: "Optimizing Hyperparameters (Photon Engine)...",
    deploying: "Provisioning Cluster and Publishing Model...",
    scoring: "Running Batch Inference (Scoring)...",
    insights: "Generating Global Insights...",
    auditing: "Auditing customer",
    logout: "Logout",
    back: "Back",
    advance: "Advance",
    saveAndDeploy: "Save and Deploy Model →"
  }
};

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('landing');
  const [language, setLanguage] = useState<'pt' | 'en'>(() => {
    return (localStorage.getItem('churn_lang') as 'pt' | 'en') || 'pt';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('churn_theme') as 'dark' | 'light') || 'dark';
  });

  const t = translations[language];

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('churn_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [allProjects, setAllProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('churn_projects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [rawData, setRawData] = useState<CustomerData[]>([]);
  const [cleanedData, setCleanedData] = useState<CustomerData[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    targetColumn: '', featureColumns: [], idColumn: '', feedbackColumn: '', monthlyIncomeColumn: '', totalIncomeColumn: ''
  });
  
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [feedbackInsight, setFeedbackInsight] = useState<FeedbackInsight | null>(null);
  const [globalInsights, setGlobalInsights] = useState<GlobalInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(t.loading);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-mode');
    else document.body.classList.remove('light-mode');
    localStorage.setItem('churn_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('churn_lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage(prev => prev === 'pt' ? 'en' : 'pt');

  const userProjects = useMemo(() => {
    return allProjects.filter(p => p.userId === user?.id);
  }, [allProjects, user]);

  useEffect(() => {
    if (user) localStorage.setItem('churn_current_user', JSON.stringify(user));
    else localStorage.removeItem('churn_current_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('churn_projects', JSON.stringify(allProjects));
  }, [allProjects]);

  useEffect(() => {
    if (rawData.length > 0 && !currentProject?.isTrained && mapping.targetColumn === '') {
      const cols = Object.keys(rawData[0]);
      const findCol = (terms: string[]) => {
        for (const term of terms) {
          const match = cols.find(c => c.toLowerCase() === term.toLowerCase());
          if (match) return match;
        }
        return cols.find(c => terms.some(t => c.toLowerCase().includes(t.toLowerCase()))) || '';
      };
      setMapping(prev => ({
        ...prev,
        idColumn: findCol(['customerid', 'id', 'client', 'customer', 'uid', 'pk']),
        targetColumn: findCol(['churn', 'cancel', 'target', 'churn_status', 'label']),
        monthlyIncomeColumn: findCol(['monthlycharges', 'monthly', 'mrr', 'mensalidade', 'valor_mensal']),
        totalIncomeColumn: findCol(['totalcharges', 'total', 'ltv', 'acumulado', 'revenue']),
        feedbackColumn: findCol(['feedback', 'review', 'comment', 'message', 'opinião']),
      }));
    }
  }, [rawData, currentProject]);

  const handleLogout = () => {
    setUser(null);
    setCurrentProject(null);
    setStep('landing');
  };

  const handleSelectProject = (p: Project) => {
    setCurrentProject(p);
    setMapping(p.mapping);
    setSelectedModel(p.selectedModel);
    setStep('upload');
  };

  const handleCreateProject = () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setStep('project_init');
  };

  const handleImportProject = () => {
    setStep('model_import');
  };

  const handleImportModelConfirmed = (name: string, uri: string) => {
    const proj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: `MLflow External Model: ${uri}`,
      company: user?.company || 'Simulation',
      userId: user?.id || 'guest',
      createdAt: new Date().toISOString(),
      mapping: { targetColumn: '', featureColumns: [], idColumn: '', feedbackColumn: '', monthlyIncomeColumn: '', totalIncomeColumn: '' },
      selectedModel: 'External MLflow',
      isTrained: true,
      isExternal: true,
      modelUri: uri
    };
    setCurrentProject(proj);
    setMapping(proj.mapping);
    setStep('upload');
  };

  const handleDataLoaded = async (data: CustomerData[]) => {
    setRawData(data);
    const headers = Object.keys(data[0] || {});
    const hasPredictions = headers.includes('PREDICTION_RISK');

    if (hasPredictions) {
      setLoadingMessage(language === 'pt' ? 'Detectada base já auditada. Restaurando...' : 'Rehydrating audited file. Restoring...');
      setIsLoading(true);
      const idCol = headers.find(h => ['customerid', 'id', 'client', 'PREDICTION_ID'].includes(h.toUpperCase())) || headers[0];
      const mrrCol = headers.find(h => ['MRR', 'MONTHLYCHARGES', 'VALOR_MENSAL'].includes(h.toUpperCase())) || '';
      const updatedMapping: ColumnMapping = {
        idColumn: idCol,
        targetColumn: 'PREDICTION_RISK',
        monthlyIncomeColumn: mrrCol,
        totalIncomeColumn: '',
        feedbackColumn: headers.find(h => ['FEEDBACK', 'COMMENT'].includes(h.toUpperCase())) || '',
        featureColumns: []
      };
      setMapping(updatedMapping);
      const rehydratedData = data.map(row => {
        const risk = String(row['PREDICTION_RISK'] || 'Low');
        const scoreStr = String(row['PREDICTION_SCORE'] || '0%').replace('%', '');
        const score = parseFloat(scoreStr) / 100;
        return { ...row, _riskLevel: risk, _riskScore: score, _ai_sentiment_rating: row['AI_SENTIMENT'] || 'Médio' };
      });
      setCleanedData(rehydratedData);
      if (!currentProject?.isTrained) {
         const autoProj: Project = currentProject || {
            id: Math.random().toString(36).substr(2, 9),
            name: "Audit Recovered",
            description: "Restored from exported file",
            company: user?.company || 'Guest',
            userId: user?.id || 'guest',
            createdAt: new Date().toISOString(),
            mapping: updatedMapping,
            selectedModel: 'Rehydrated File',
            isTrained: true
         };
         setCurrentProject(autoProj);
      }
      finalizeAndGoToDashboard(rehydratedData, true);
      return;
    }

    setCleanedData(data);
    if (currentProject?.isTrained) {
      if (mapping.feedbackColumn) {
        setLoadingMessage(language === 'pt' ? 'Mosaic AI: Enriquecendo sentimentos...' : 'Mosaic AI: Enriching sentiments...');
        setIsLoading(true);
        try {
          const feedbacks = data.map((d, i) => ({ id: d[mapping.idColumn] || i, text: String(d[mapping.feedbackColumn] || "") })).filter(f => f.text.length > 2);
          const insight = await callDatabricksAIFunction(feedbacks);
          setFeedbackInsight(insight);
          const enrichedData = data.map((row) => {
            const fbText = String(row[mapping.feedbackColumn] || "").trim().toLowerCase();
            const nlpMatch = insight.samples.find(s => s.text.trim().toLowerCase() === fbText);
            return { ...row, _ai_sentiment_rating: nlpMatch?.rating || 'Médio', _ai_sentiment_score: nlpMatch?.score || 0.5 };
          });
          setCleanedData(enrichedData);
          finalizeAndGoToDashboard(enrichedData, true);
        } catch (err) {
          finalizeAndGoToDashboard(data, true);
        } finally {
          setIsLoading(false);
        }
      } else {
        finalizeAndGoToDashboard(data, true);
      }
    } else {
       setStep('preview');
    }
  };

  const handleStartProjectFlow = () => {
    if (!newProjectName) return alert(language === 'pt' ? "Informe um nome." : "Enter a name.");
    const proj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName,
      description: newProjectDesc,
      company: user?.company || 'Simulation',
      userId: user?.id || 'guest',
      createdAt: new Date().toISOString(),
      mapping: { targetColumn: '', featureColumns: [], idColumn: '', feedbackColumn: '', monthlyIncomeColumn: '', totalIncomeColumn: '' },
      selectedModel: '',
      isTrained: false
    };
    setCurrentProject(proj);
    setMapping(proj.mapping);
    setStep('upload');
  };

  const handleGoToNLP = async () => {
    setLoadingMessage(language === 'pt' ? 'Extraindo sentimentos...' : 'Extracting sentiments...');
    setIsLoading(true);
    setStep('nlp_verification');
    try {
      const feedbacks = cleanedData.map((d, i) => ({ id: d[mapping.idColumn] || i, text: String(d[mapping.feedbackColumn] || "") })).filter(f => f.text.length > 2);
      const insight = await callDatabricksAIFunction(feedbacks);
      setFeedbackInsight(insight);
    } catch (err) { setStep('insights'); }
    finally { setIsLoading(false); }
  };

  // Fixed missing handleGoToInsights function
  const handleGoToInsights = () => {
    setStep('insights');
  };

  const handleFinishNLP = (excludedIndices: number[]) => {
    const virtualTable = cleanedData.map((row, idx) => {
      if (excludedIndices.includes(idx)) return null;
      const fbText = String(row[mapping.feedbackColumn] || "").trim().toLowerCase();
      const nlpMatch = feedbackInsight?.samples.find(s => s.text.trim().toLowerCase() === fbText);
      return { ...row, _ai_sentiment_rating: nlpMatch?.rating || 'Médio', _ai_sentiment_score: nlpMatch?.score || 0.5 };
    }).filter(r => r !== null) as CustomerData[];
    setCleanedData(virtualTable);
    if (currentProject?.isExternal) saveExternalProjectAndGo(virtualTable);
    else setStep('insights');
  };

  const saveExternalProjectAndGo = async (data: CustomerData[]) => {
    const isGuest = user?.id.startsWith('guest_');
    const newProject: Project = { ...currentProject!, mapping, isTrained: true };
    if (!isGuest) {
      setAllProjects(prev => {
        const existing = prev.findIndex(p => p.id === newProject.id);
        if (existing >= 0) { const copy = [...prev]; copy[existing] = newProject; return copy; }
        return [...prev, newProject];
      });
    }
    setCurrentProject(newProject);
    finalizeAndGoToDashboard(data, true);
  };

  const handleTrainModels = async () => {
    setLoadingMessage(t.trainPhoton);
    setIsLoading(true);
    try {
      const metrics = await simulateModelTournament(cleanedData, mapping.featureColumns, mapping.targetColumn);
      setModelMetrics(metrics);
      setSelectedModel(metrics.find(m => m.suggested)?.name || metrics[0]?.name || '');
      setStep('tournament');
    } catch (err) { finalizeAndGoToDashboard(); }
    finally { setIsLoading(false); }
  };

  const handleSaveProjectAndDeploy = async () => {
    setLoadingMessage(t.deploying);
    setIsLoading(true);
    setTimeout(async () => {
      try {
        const newProject: Project = { ...currentProject!, mapping, selectedModel, isTrained: true };
        if (!user?.id.startsWith('guest_')) {
          setAllProjects(prev => {
            const existing = prev.findIndex(p => p.id === newProject.id);
            if (existing >= 0) { const copy = [...prev]; copy[existing] = newProject; return copy; }
            return [...prev, newProject];
          });
        }
        setCurrentProject(newProject);
        await finalizeAndGoToDashboard();
      } catch (err) { setIsLoading(false); }
    }, 1500);
  };

  const finalizeAndGoToDashboard = async (overrideData?: CustomerData[], isScoring: boolean = false) => {
    setLoadingMessage(isScoring ? t.scoring : t.insights);
    setIsLoading(true);
    const dataToUse = overrideData || cleanedData;
    try {
      if (overrideData) setCleanedData(overrideData);
      const insights = await getGlobalInsights(dataToUse, mapping, isScoring);
      setGlobalInsights(insights);
      setStep('global_dashboard');
    } catch (err) { setStep('global_dashboard'); }
    finally { setIsLoading(false); }
  };

  const handlePredict = async (id: string) => {
    const customer = cleanedData.find(d => String(d[mapping.idColumn]) === id);
    if (!customer) return;
    setLoadingMessage(`${t.auditing} ${id}...`);
    setIsLoading(true);
    try {
      const result = await getPredictionInsight(customer, mapping.featureColumns, mapping.targetColumn || "churn", selectedModel, mapping.idColumn, mapping.feedbackColumn);
      setCurrentPrediction(result);
      setStep('validation');
    } catch (err) { setStep('validation'); }
    finally { setIsLoading(false); }
  };

  const toggleFeature = (col: string) => {
    setMapping(prev => ({ ...prev, featureColumns: prev.featureColumns.includes(col) ? prev.featureColumns.filter(f => f !== col) : [...prev.featureColumns, col] }));
  };

  const isReservedColumn = (col: string) => col === mapping.targetColumn || col === mapping.idColumn || col === mapping.feedbackColumn || col === mapping.monthlyIncomeColumn || col === mapping.totalIncomeColumn;
  const availableColumns = Object.keys(rawData[0] || {});
  const selectableFeatures = useMemo(() => availableColumns.filter(c => !isReservedColumn(c)), [availableColumns, mapping]);
  const allSelected = useMemo(() => selectableFeatures.length > 0 && selectableFeatures.every(f => mapping.featureColumns.includes(f)), [selectableFeatures, mapping.featureColumns]);
  const toggleAllFeatures = () => setMapping(prev => ({ ...prev, featureColumns: allSelected ? [] : selectableFeatures }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-40 min-h-screen relative">
      <header className="mb-12 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => user ? setStep('landing') : null}>
          <div className="bg-orange-600 p-3 rounded-2xl shadow-xl">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-orange-600 leading-none">Churn Insight</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user ? `${t.workspace}: ${user.company}` : 'Mosaic AI Enterprise'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleLanguage} className="px-4 py-2.5 bg-slate-800 rounded-2xl text-slate-300 border border-slate-700 shadow-lg flex items-center gap-2 hover:bg-slate-700 transition-all">
             <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span className="text-[10px] font-black uppercase tracking-widest">{language}</span>
          </button>
          <button onClick={toggleTheme} className="p-2.5 bg-slate-800 rounded-2xl text-slate-300 border border-slate-700 shadow-lg">
            {theme === 'dark' ? <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> : <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>
      </header>

      <main>
        {step === 'landing' && user && <WorkspaceView language={language} user={user} onLogout={handleLogout} onCreateProject={handleCreateProject} onImportProject={handleImportProject} onSelectProject={handleSelectProject} savedProjects={userProjects} />}
        {step === 'landing' && !user && <LandingView language={language} onLogin={setUser} onSelectProject={handleSelectProject} onCreateProject={handleCreateProject} onImportProject={handleImportProject} savedProjects={[]} />}
        
        {step === 'model_import' && <ModelImporter language={language} onImport={handleImportModelConfirmed} onFileImport={handleDataLoaded} onCancel={() => setStep('landing')} />}

        {step === 'project_init' && (
          <div className="max-w-xl mx-auto bg-[#101927] p-12 rounded-[56px] border border-slate-800 shadow-3xl animate-in zoom-in-95">
             <h2 className="text-3xl font-black text-white mb-8 tracking-tight">{t.newExperiment}</h2>
             <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-2">{t.expName}</label>
                  <input type="text" placeholder="Ex: Churn Retention Q4" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-orange-500" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-2">{t.expDesc}</label>
                  <textarea placeholder="Ex: Analyze customer base to reduce churn..." className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-orange-500 resize-none" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} />
                </div>
                <button onClick={handleStartProjectFlow} className="w-full bg-orange-600 py-6 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-orange-500 shadow-xl transition-all mt-4">{t.continue}</button>
             </div>
          </div>
        )}

        {step === 'upload' && (
           <div className="max-w-3xl mx-auto text-center space-y-10 animate-in zoom-in-95">
              <h2 className="text-4xl font-black text-white">{currentProject?.isTrained ? `Scoring: ${currentProject.name}` : (language === 'pt' ? 'Carregar Dados de Treino' : 'Load Training Data')}</h2>
              <FileUpload language={language} onDataLoaded={handleDataLoaded} label={currentProject?.isTrained ? (language === 'pt' ? "Carregar Base para Predição" : "Load Scoring Data") : undefined} />
           </div>
        )}
        {step === 'preview' && <DataPreview language={language} data={rawData} onContinue={() => setStep('cleaning')} onCancel={() => setStep('landing')} />}
        {step === 'cleaning' && <DataCleaningStudio language={language} data={rawData} onFinishCleaning={(newData) => { setCleanedData(newData); setStep('setup'); }} />}
        
        {step === 'setup' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h2 className="text-3xl font-black text-white">Data Catalog Setup</h2>
                  <p className="text-slate-500 text-sm">{language === 'pt' ? 'Configure o mapeamento para Mosaic AI.' : 'Configure mapping for Mosaic AI.'}</p>
               </div>
               <div className="flex gap-4">
                 {mapping.feedbackColumn && (
                   <button onClick={handleGoToNLP} className="px-8 py-5 rounded-[24px] font-black text-orange-500 border-2 border-orange-500 uppercase text-xs tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all">{language === 'pt' ? 'Analisar Sentimentos (IA)' : 'Analyze Sentiment (AI)'}</button>
                 )}
                 <button onClick={currentProject?.isExternal ? () => saveExternalProjectAndGo(cleanedData) : handleGoToInsights} disabled={!mapping.idColumn || (!currentProject?.isExternal && !mapping.targetColumn)} className={`px-8 py-5 rounded-[24px] font-black text-white uppercase text-xs tracking-[0.2em] shadow-2xl transition-all ${(!mapping.idColumn || (!currentProject?.isExternal && !mapping.targetColumn)) ? 'bg-slate-800 cursor-not-allowed text-slate-600' : 'bg-orange-600 hover:bg-orange-500'}`}>{language === 'pt' ? 'Avançar para Análise →' : 'Next to Analysis →'}</button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#101927] p-8 rounded-[40px] border border-slate-800 shadow-xl">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800 pb-4">Business Metadata</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-600 ml-2">{language === 'pt' ? 'ID Cliente (Único)' : 'Customer ID (Unique)'}</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300" value={mapping.idColumn} onChange={e => setMapping(prev => ({ ...prev, idColumn: e.target.value }))}>
                        <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                        {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {!currentProject?.isExternal && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-600 ml-2">{language === 'pt' ? 'Alvo (Churn/Cancelamento)' : 'Target (Churn/Cancel)'}</label>
                            <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300" value={mapping.targetColumn} onChange={e => setMapping(prev => ({ ...prev, targetColumn: e.target.value }))}>
                                <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                                {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-600 ml-2">{language === 'pt' ? 'Faturamento Mensal (MRR)' : 'Monthly Revenue (MRR)'}</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300" value={mapping.monthlyIncomeColumn} onChange={e => setMapping(prev => ({ ...prev, monthlyIncomeColumn: e.target.value }))}>
                        <option value="">{language === 'pt' ? 'Ignorar' : 'Ignore'}</option>
                        {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-600 ml-2">{language === 'pt' ? 'Faturamento Total (LTV)' : 'Total Revenue (LTV)'}</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300" value={mapping.totalIncomeColumn} onChange={e => setMapping(prev => ({ ...prev, totalIncomeColumn: e.target.value }))}>
                        <option value="">{language === 'pt' ? 'Ignorar' : 'Ignore'}</option>
                        {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-600 ml-2">{language === 'pt' ? 'Feedback Texto/Voz' : 'Feedback Text/Voice'}</label>
                      <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300" value={mapping.feedbackColumn} onChange={e => setMapping(prev => ({ ...prev, feedbackColumn: e.target.value }))}>
                        <option value="">{language === 'pt' ? 'Ignorar' : 'Ignore'}</option>
                        {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-[#101927] p-8 rounded-[40px] border border-slate-800 shadow-xl">
                 <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'pt' ? 'Feature Selection (Variáveis)' : 'Feature Selection (Variables)'}</h3>
                    <button onClick={toggleAllFeatures} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${allSelected ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-orange-600/10 border-orange-500/30 text-orange-500'}`}>{allSelected ? (language === 'pt' ? 'Desmarcar Tudo' : 'Deselect All') : (language === 'pt' ? 'Selecionar Tudo' : 'Select All')}</button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                    {availableColumns.map(c => !isReservedColumn(c) && (
                         <button key={c} onClick={() => toggleFeature(c)} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${mapping.featureColumns.includes(c) ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>{c}</button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {step === 'nlp_verification' && <NLPVerificationView language={language} insight={feedbackInsight} feedbackColumn={mapping.feedbackColumn} rawData={cleanedData} onContinue={handleFinishNLP} onBack={() => setStep('setup')} />}
        {step === 'insights' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <div>
                 <h2 className="text-3xl font-black text-white">{language === 'pt' ? 'Análise de Dados' : 'Data Analysis'}</h2>
                 <p className="text-slate-500 text-sm">{language === 'pt' ? 'Significância estatística das features.' : 'Statistical significance of features.'}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep('setup')} className="px-8 py-5 rounded-[24px] font-black text-slate-400 border border-slate-800 uppercase text-xs tracking-widest hover:text-white transition-all">← {t.back}</button>
                <button onClick={handleTrainModels} className="bg-orange-600 px-10 py-5 rounded-[24px] font-black text-white uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-orange-500 transition-all">{t.advance} →</button>
              </div>
            </div>
            <InsightsView language={language} data={cleanedData} mapping={mapping} onToggleFeature={toggleFeature} selectedFeatures={mapping.featureColumns} suggestedDrops={[] as string[]} />
          </div>
        )}

        {step === 'tournament' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black text-white">Model Arena</h2>
              <button onClick={() => setStep('insights')} className="px-8 py-5 rounded-[24px] font-black text-slate-400 border border-slate-800 uppercase text-xs tracking-widest hover:text-white transition-all">← {t.back}</button>
            </div>
            <ModelTournament language={language} metrics={modelMetrics} selectedModel={selectedModel} onSelectModel={setSelectedModel} />
            <div className="flex justify-center pt-8">
              <button onClick={handleSaveProjectAndDeploy} className="bg-orange-600 px-20 py-6 rounded-[32px] font-black text-white uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-orange-500 transition-all hover:scale-105 active:scale-95">{t.saveAndDeploy}</button>
            </div>
          </div>
        )}

        {step === 'global_dashboard' && globalInsights && (
          <GlobalDashboard 
            language={language}
            data={cleanedData} 
            insights={globalInsights} 
            mapping={mapping} 
            feedbackInsight={feedbackInsight} 
            onDrillDown={handlePredict} 
            onDataRefresh={handleDataLoaded} 
            onGoBackToWorkspace={() => setStep('landing')}
            onGoBackToModels={() => setStep('tournament')}
          />
        )}
        {step === 'validation' && currentPrediction && (
          <div className="space-y-8">
            <button onClick={() => setStep('global_dashboard')} className="p-4 bg-slate-900 rounded-3xl border border-slate-800 text-white flex items-center gap-2 group"><span className="group-hover:-translate-x-1 transition-transform">←</span> {t.back}</button>
            <ValidationView language={language} result={currentPrediction} />
          </div>
        )}
      </main>

      <ChatBot language={language} data={cleanedData} />

      {isLoading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex flex-col items-center justify-center">
           <div className="w-24 h-24 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-10"></div>
           <p className="text-orange-500 font-black uppercase tracking-[0.4em] text-sm animate-pulse">{loadingMessage}</p>
           <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mosaic AI - Enterprise Engine</div>
        </div>
      )}
    </div>
  );
};

export default App;
