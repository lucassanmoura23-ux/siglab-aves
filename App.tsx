
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
import { LayoutGrid, Menu, X, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { pushToCloud, fetchFromCloud } from './services/cloudSyncService';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  // Código de Sincronização
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

  // --- Lógica de Sincronização ---

  const handlePushData = useCallback(async (recs: ProductionRecord[], batches: BatchRecord[]) => {
    if (!cloudKey || cloudKey.length < 4) return;
    setSyncStatus('syncing');
    const success = await pushToCloud(cloudKey, { records: recs, batchRecords: batches });
    setSyncStatus(success ? 'synced' : 'error');
  }, [cloudKey]);

  const handleFetchData = useCallback(async () => {
    if (!cloudKey || cloudKey.length < 4) return;
    setSyncStatus('syncing');
    const cloudData = await fetchFromCloud(cloudKey);
    if (cloudData) {
      // Mesclar dados (prioridade para nuvem neste caso simples)
      setRecords(cloudData.records);
      setBatchRecords(cloudData.batchRecords);
      setSyncStatus('synced');
    } else {
      setSyncStatus('idle');
    }
  }, [cloudKey]);

  // Ao mudar a chave ou iniciar, buscar da nuvem
  useEffect(() => {
    if (cloudKey) {
      handleFetchData();
      localStorage.setItem('siglab_cloud_key', cloudKey);
    }
  }, [cloudKey, handleFetchData]);

  // Ao mudar os dados locais, agendar envio para nuvem (Debounce de 2s)
  useEffect(() => {
    localStorage.setItem('siglab_records', JSON.stringify(records));
    localStorage.setItem('siglab_batch_records', JSON.stringify(batchRecords));

    const timeout = setTimeout(() => {
      handlePushData(records, batchRecords);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [records, batchRecords, handlePushData]);

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
            onCancel={() => setCurrentView('daily-records')}
          />
        );
      case 'daily-records':
        return (
          <DailyRecords 
            records={records} 
            batchRecords={batchRecords}
            onEditRecord={(r) => { setEditingRecord(r); setCurrentView('new-production'); }}
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
            onImportRecords={(recs) => {
              const updated = [...recs, ...batchRecords];
              setBatchRecords(updated);
              setRecords(prev => syncProductionWithBatches(prev, updated));
            }}
          />
        );
      case 'new-batch-characterization':
        return (
          <BatchForm
            initialData={editingBatch}
            onSave={handleSaveBatch}
            onCancel={() => setCurrentView('batch-characteristics')}
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
            onUpdateKey={setCloudKey} 
            onForceSync={handleFetchData}
            syncStatus={syncStatus}
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
        <div className="w-full max-w-[1400px] mx-auto pb-10">
          
          <div className="flex justify-between items-center mb-6 md:mb-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Menu size={24} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('dashboard')}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-md">
                   <svg viewBox="0 0 100 100" className="w-7 h-7 md:w-9 md:h-9" fill="none">
                    <path d="M35 45 L50 35 L65 45 L65 65 L35 65 Z" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 className="text-lg md:text-2xl font-black text-[#1e293b] tracking-tight uppercase">
                  SIGLAB <span className="bg-gradient-to-r from-emerald-500 to-cyan-600 bg-clip-text text-transparent">AVIÁRIO</span>
                </h1>
              </div>
            </div>

            {/* Sync Badge */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                syncStatus === 'synced' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                syncStatus === 'syncing' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                syncStatus === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                'bg-gray-50 border-gray-100 text-gray-400'
              }`}>
                {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : 
                 syncStatus === 'synced' ? <CheckCircle2 size={12} /> : 
                 syncStatus === 'error' ? <CloudOff size={12} /> : <Cloud size={12} />}
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                  {syncStatus === 'syncing' ? 'Sincronizando...' : 
                   syncStatus === 'synced' ? 'Nuvem OK' : 
                   syncStatus === 'error' ? 'Erro Conexão' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
