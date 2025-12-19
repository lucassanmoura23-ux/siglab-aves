
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProductionForm } from './components/ProductionForm';
import { DailyRecords } from './components/DailyRecords';
import { BatchCharacteristics } from './components/BatchCharacteristics';
import { BatchForm } from './components/BatchForm';
import { AviaryDashboard } from './components/AviaryDashboard';
import { GeneralDashboard } from './components/GeneralDashboard';
import { AIReports } from './components/AIReports';
import { LandingPage } from './components/LandingPage';
import { SyncManager } from './components/SyncManager';
import { ViewState, ProductionRecord, BatchRecord } from './types';
import { LayoutGrid, Menu, X, Share2, Cloud, CloudOff, RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react';
import { saveToCloud, fetchFromCloud } from './services/cloudSyncService';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  
  const [cloudKey, setCloudKey] = useState<string>(() => {
    return localStorage.getItem('siglab_cloud_key') || '';
  });

  const [records, setRecords] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem('siglab_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>(() => {
    const saved = localStorage.getItem('siglab_batch_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);

  // --- Lógica de Sincronização Robusta ---
  
  const pushDataToCloud = useCallback(async (currentRecords: ProductionRecord[], currentBatches: BatchRecord[]) => {
    if (!cloudKey || cloudKey.length < 3) return;
    setCloudStatus('syncing');
    const success = await saveToCloud(cloudKey, { records: currentRecords, batchRecords: currentBatches });
    setCloudStatus(success ? 'synced' : 'error');
  }, [cloudKey]);

  const pullDataFromCloud = useCallback(async (key: string) => {
    if (!key || key.length < 3) return;
    setCloudStatus('syncing');
    const cloudData = await fetchFromCloud(key);
    if (cloudData) {
      // Evitar sobrescrever se os dados locais forem mais recentes (opcional, aqui priorizamos nuvem)
      setRecords(cloudData.records);
      setBatchRecords(cloudData.batchRecords);
      setCloudStatus('synced');
    } else {
      setCloudStatus('synced'); // Caso seja uma chave nova sem dados
    }
  }, []);

  // Inicialização: Puxa dados da nuvem ao abrir
  useEffect(() => {
    if (cloudKey) {
      pullDataFromCloud(cloudKey);
    }
  }, [cloudKey, pullDataFromCloud]);

  // Salva localmente e sincroniza com a nuvem após mudanças
  useEffect(() => {
    localStorage.setItem('siglab_records', JSON.stringify(records));
    localStorage.setItem('siglab_batch_records', JSON.stringify(batchRecords));
    localStorage.setItem('siglab_cloud_key', cloudKey);
    
    const timeout = setTimeout(() => {
      pushDataToCloud(records, batchRecords);
    }, 1500); // Debounce para não sobrecarregar a API
    
    return () => clearTimeout(timeout);
  }, [records, batchRecords, cloudKey, pushDataToCloud]);

  const syncProductionWithBatches = (currentProduction: ProductionRecord[], currentBatches: BatchRecord[]): ProductionRecord[] => {
    return currentProduction.map(prod => {
      const aviaryId = prod.aviaryId;
      const recordDate = prod.date;
      const activeBatch = currentBatches
        .filter(b => b.aviaryId === aviaryId)
        .filter(b => b.date <= recordDate)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const newBatchId = activeBatch ? activeBatch.batchId : '-';
      if (prod.batchId !== newBatchId) {
        return { ...prod, batchId: newBatchId };
      }
      return prod;
    });
  };

  const handleSaveRecord = (record: ProductionRecord) => {
    if (editingRecord) {
      setRecords(prev => prev.map(r => r.id === record.id ? record : r));
      setEditingRecord(null);
    } else {
      setRecords(prev => [record, ...prev]);
    }
    setCurrentView('daily-records');
  };

  const handleEditRecord = (record: ProductionRecord) => {
    setEditingRecord(record);
    setCurrentView('new-production');
  };

  const handleSaveBatch = (record: BatchRecord) => {
    let updatedBatches: BatchRecord[];
    if (editingBatch) {
      updatedBatches = batchRecords.map(r => r.id === record.id ? record : r);
      setEditingBatch(null);
    } else {
      updatedBatches = [record, ...batchRecords];
    }
    setBatchRecords(updatedBatches);
    setRecords(prev => syncProductionWithBatches(prev, updatedBatches));
    setCurrentView('batch-characteristics');
  };

  const handleSyncUpdate = (newKey: string) => {
    setCloudKey(newKey);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'new-production') setEditingRecord(null);
    if (view === 'new-batch-characterization') setEditingBatch(null);
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <GeneralDashboard records={records} batchRecords={batchRecords} />;
      case 'new-production':
        return (
          <ProductionForm 
            initialData={editingRecord}
            batchRecords={batchRecords}
            onSave={handleSaveRecord} 
            onCancel={() => handleNavigate('daily-records')}
          />
        );
      case 'daily-records':
        return (
          <DailyRecords 
            records={records} 
            batchRecords={batchRecords}
            onEditRecord={handleEditRecord}
            onDeleteRecord={(id) => setRecords(prev => prev.filter(r => r.id !== id))}
            onDeleteAll={() => setRecords([])}
            onImportRecords={(recs) => setRecords(prev => [...recs, ...prev])}
          />
        );
      case 'batch-characteristics':
        return (
          <BatchCharacteristics 
            records={batchRecords}
            productionRecords={records}
            onNewRecord={() => handleNavigate('new-batch-characterization')}
            onEditRecord={(r) => { setEditingBatch(r); setCurrentView('new-batch-characterization'); }}
            onDeleteRecord={(id) => {
              const updated = batchRecords.filter(r => r.id !== id);
              setBatchRecords(updated);
              setRecords(prev => syncProductionWithBatches(prev, updated));
            }}
            onDeleteAll={() => setBatchRecords([])}
            onImportRecords={(recs) => setBatchRecords(prev => [...recs, ...prev])}
          />
        );
      case 'new-batch-characterization':
        return (
          <BatchForm
            initialData={editingBatch}
            onSave={handleSaveBatch}
            onCancel={() => handleNavigate('batch-characteristics')}
          />
        );
      case 'aviary-details':
        return <AviaryDashboard records={records} />;
      case 'ai-reports':
        return <AIReports records={records} batchRecords={batchRecords} />;
      case 'sync-devices':
        return (
          <SyncManager 
            currentKey={cloudKey}
            onUpdateKey={handleSyncUpdate}
          />
        );
      default:
        return <GeneralDashboard records={records} batchRecords={batchRecords} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto h-screen transition-all relative">
        <div className="w-full max-w-[1400px] mx-auto pb-20">
          
          {/* Header Superior Dinâmico */}
          <div className="flex justify-between items-center mb-6 md:mb-10 bg-white/90 backdrop-blur-md p-3 -mx-4 -mt-4 md:m-0 rounded-none md:rounded-2xl sticky top-0 z-20 border-b md:border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('dashboard')}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                   <svg viewBox="0 0 100 100" className="w-5 h-5 md:w-6 md:h-6" fill="white">
                    <path d="M35 45 L50 35 L65 45 L65 65 L35 65 Z" fill="white" />
                  </svg>
                </div>
                <h1 className="text-sm md:text-xl font-black text-[#1e293b] tracking-tight uppercase">
                  SIGLAB <span className="text-blue-600">AVIÁRIO</span>
                </h1>
              </div>
            </div>

            {/* Status de Sincronização e Botão de Refresh */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => pullDataFromCloud(cloudKey)}
                title="Forçar Atualização da Nuvem"
                className={`p-2 rounded-xl transition-all ${cloudStatus === 'syncing' ? 'bg-blue-50 text-blue-600 animate-spin' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
              >
                <RefreshCw size={18} />
              </button>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                cloudStatus === 'synced' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                cloudStatus === 'syncing' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                'bg-red-50 border-red-100 text-red-600'
              }`}>
                {cloudStatus === 'synced' ? <CheckCircle2 size={14} /> : 
                 cloudStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : 
                 <CloudOff size={14} />}
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                  {cloudStatus === 'synced' ? 'Sincronizado' : 
                   cloudStatus === 'syncing' ? 'Conectando...' : 
                   'Erro de Nuvem'}
                </span>
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderContent()}
          </div>
        </div>

        {/* FAB Mobile */}
        {currentView !== 'new-production' && (
          <button 
            onClick={() => handleNavigate('new-production')}
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
          >
            <PlusCircle size={28} />
          </button>
        )}
      </main>
    </div>
  );
};

export default App;
