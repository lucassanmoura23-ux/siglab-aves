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
// Fixed missing PlusCircle import from lucide-react
import { LayoutGrid, Menu, X, Share2, Cloud, CloudOff, RefreshCw, PlusCircle } from 'lucide-react';
import { saveToCloud, fetchFromCloud } from './services/cloudSyncService';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  
  // Chave de Nuvem para Sincronização entre Dispositivos
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
  
  const pushDataToCloud = useCallback(async (currentRecords: ProductionRecord[], currentBatches: BatchRecord[]) => {
    if (!cloudKey) return;
    setCloudStatus('syncing');
    const success = await saveToCloud(cloudKey, { records: currentRecords, batchRecords: currentBatches });
    setCloudStatus(success ? 'synced' : 'offline');
  }, [cloudKey]);

  const pullDataFromCloud = useCallback(async (key: string) => {
    if (!key) return;
    setCloudStatus('syncing');
    const cloudData = await fetchFromCloud(key);
    if (cloudData) {
      setRecords(cloudData.records);
      setBatchRecords(cloudData.batchRecords);
      setCloudStatus('synced');
    } else {
      setCloudStatus('offline');
    }
  }, []);

  // Inicialização e Monitoramento de Mudanças
  useEffect(() => {
    if (cloudKey) {
      pullDataFromCloud(cloudKey);
      localStorage.setItem('siglab_cloud_key', cloudKey);
    }
  }, [cloudKey, pullDataFromCloud]);

  // Persistência Local e Gatilho de Nuvem
  useEffect(() => {
    localStorage.setItem('siglab_records', JSON.stringify(records));
    localStorage.setItem('siglab_batch_records', JSON.stringify(batchRecords));
    
    // Auto-Sync Debounce
    const timeout = setTimeout(() => {
      pushDataToCloud(records, batchRecords);
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [records, batchRecords, pushDataToCloud]);

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

  const handleImportRecords = (newRecords: ProductionRecord[]) => {
    setRecords(prev => [...newRecords, ...prev]);
  };

  const handleEditRecord = (record: ProductionRecord) => {
    setEditingRecord(record);
    setCurrentView('new-production');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
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

  const handleEditBatch = (record: BatchRecord) => {
    setEditingBatch(record);
    setCurrentView('new-batch-characterization');
  };

  const handleDeleteBatch = (id: string) => {
    const updatedBatches = batchRecords.filter(r => r.id !== id);
    setBatchRecords(updatedBatches);
    setRecords(prev => syncProductionWithBatches(prev, updatedBatches));
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
            onDeleteRecord={handleDeleteRecord}
            onDeleteAll={() => setRecords([])}
            onImportRecords={handleImportRecords}
          />
        );
      case 'batch-characteristics':
        return (
          <BatchCharacteristics 
            records={batchRecords}
            productionRecords={records}
            onNewRecord={() => handleNavigate('new-batch-characterization')}
            onEditRecord={handleEditBatch}
            onDeleteRecord={handleDeleteBatch}
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
          <div className="flex justify-between items-center mb-6 md:mb-10 bg-white/80 backdrop-blur-md p-3 -mx-4 -mt-4 md:m-0 rounded-none md:rounded-2xl sticky top-0 z-20 border-b md:border border-gray-100 shadow-sm md:shadow-none">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
              
              <div 
                className="flex items-center gap-2 group cursor-pointer" 
                onClick={() => handleNavigate('dashboard')}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                   <svg viewBox="0 0 100 100" className="w-5 h-5 md:w-6 md:h-6" fill="none">
                    <path d="M35 45 L50 35 L65 45 L65 65 L35 65 Z" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 className="text-sm md:text-xl font-black text-[#1e293b] tracking-tight uppercase">
                  SIGLAB <span className="text-blue-600">AVIÁRIO</span>
                </h1>
              </div>
            </div>

            {/* Status de Sincronização */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                {cloudStatus === 'synced' ? (
                  <Cloud size={14} className="text-emerald-500" />
                ) : cloudStatus === 'syncing' ? (
                  <RefreshCw size={14} className="text-blue-500 animate-spin" />
                ) : (
                  <CloudOff size={14} className="text-red-500" />
                )}
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:inline">
                  {cloudStatus === 'synced' ? 'Conectado' : cloudStatus === 'syncing' ? 'Sincronizando' : 'Offline'}
                </span>
              </div>
              
              <button 
                onClick={() => handleNavigate('sync-devices')}
                className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Share2 size={14} /> Sincronizar
              </button>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderContent()}
          </div>
        </div>

        {/* Floating Action Button for Mobile Production */}
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