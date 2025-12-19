
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
import { ViewState, ProductionRecord, BatchRecord } from './types';
import { Menu, Plus, LayoutGrid, Cloud, CloudOff, CloudSync } from 'lucide-react';
import { syncService } from './services/syncService';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  
  // Cloud Sync Key
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('siglab_sync_id') || '');

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

  // Persist local changes to localStorage
  useEffect(() => {
    localStorage.setItem('siglab_records', JSON.stringify(records));
    localStorage.setItem('siglab_batch_records', JSON.stringify(batchRecords));
  }, [records, batchRecords]);

  // Handle Sync ID change
  useEffect(() => {
    if (syncId) localStorage.setItem('siglab_sync_id', syncId);
    else localStorage.removeItem('siglab_sync_id');
  }, [syncId]);

  /**
   * Sincronização: Mescla dados locais com dados da nuvem
   */
  const performSync = useCallback(async () => {
    if (!syncId) return;
    setSyncStatus('syncing');
    
    try {
      const cloudData = await syncService.fetchData(syncId);
      
      if (cloudData) {
        // Merge Logic for Production Records
        const mergedRecords = [...records];
        cloudData.records?.forEach((cloudRec: ProductionRecord) => {
          const index = mergedRecords.findIndex(r => r.id === cloudRec.id);
          if (index === -1) mergedRecords.push(cloudRec);
          else if (new Date(cloudRec.updatedAt) > new Date(mergedRecords[index].updatedAt)) {
            mergedRecords[index] = cloudRec;
          }
        });

        // Merge Logic for Batch Records
        const mergedBatches = [...batchRecords];
        cloudData.batchRecords?.forEach((cloudBatch: BatchRecord) => {
          const index = mergedBatches.findIndex(b => b.id === cloudBatch.id);
          if (index === -1) mergedBatches.push(cloudBatch);
          else if (new Date(cloudBatch.updatedAt) > new Date(mergedBatches[index].updatedAt)) {
            mergedBatches[index] = cloudBatch;
          }
        });

        setRecords(mergedRecords.sort((a, b) => b.date.localeCompare(a.date)));
        setBatchRecords(mergedBatches.sort((a, b) => b.date.localeCompare(a.date)));

        // Update Cloud with final merged state
        await syncService.updateData(syncId, { records: mergedRecords, batchRecords: mergedBatches });
        setSyncStatus('success');
      } else {
        // If sync ID exists but cloud is empty, upload current local data
        await syncService.updateData(syncId, { records, batchRecords });
        setSyncStatus('success');
      }
    } catch (error) {
      setSyncStatus('error');
    }
  }, [syncId, records, batchRecords]);

  // Auto-sync on load if key exists
  useEffect(() => {
    if (syncId) performSync();
  }, [syncId]);

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
        return { ...prod, batchId: newBatchId, updatedAt: new Date().toISOString() };
      }
      return prod;
    });
  };

  const handleSaveRecord = async (record: ProductionRecord) => {
    const now = new Date().toISOString();
    const updatedRecord = { ...record, updatedAt: now };
    
    let newRecords: ProductionRecord[];
    if (editingRecord) {
      newRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
      setEditingRecord(null);
    } else {
      newRecords = [updatedRecord, ...records];
    }
    
    setRecords(newRecords);
    setCurrentView('daily-records');
    
    // Push to cloud if synced
    if (syncId) {
      setSyncStatus('syncing');
      await syncService.updateData(syncId, { records: newRecords, batchRecords });
      setSyncStatus('success');
    }
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
    if (currentView === 'dashboard' && records.length === 0 && batchRecords.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
          <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-6">
            <LayoutGrid size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bem-vindo ao SIGLAB</h3>
          <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2 px-4">
            Comece cadastrando seu primeiro lote em "Caracterização Lotes" para poder lançar a produção diária.
          </p>
          <button 
            onClick={() => handleNavigate('batch-characteristics')}
            className="mt-8 bg-[#0f172a] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all"
          >
            Cadastrar Primeiro Lote
          </button>
        </div>
      );
    }

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
            onDeleteRecord={async (id) => {
              const newRecords = records.filter(r => r.id !== id);
              setRecords(newRecords);
              if (syncId) await syncService.updateData(syncId, { records: newRecords, batchRecords });
            }}
            onDeleteAll={async () => {
              setRecords([]);
              if (syncId) await syncService.updateData(syncId, { records: [], batchRecords });
            }}
            onImportRecords={async (recs) => {
              const updatedRecs = recs.map(r => ({ ...r, updatedAt: new Date().toISOString() }));
              const newRecords = [...updatedRecs, ...records];
              setRecords(newRecords);
              if (syncId) await syncService.updateData(syncId, { records: newRecords, batchRecords });
            }}
          />
        );
      case 'batch-characteristics':
        return (
          <BatchCharacteristics 
            records={batchRecords}
            productionRecords={records}
            onNewRecord={() => handleNavigate('new-batch-characterization')}
            onEditRecord={(r) => { setEditingBatch(r); setCurrentView('new-batch-characterization'); }}
            onDeleteRecord={async (id) => {
              const updatedBatches = batchRecords.filter(r => r.id !== id);
              const updatedRecords = syncProductionWithBatches(records, updatedBatches);
              setBatchRecords(updatedBatches);
              setRecords(updatedRecords);
              if (syncId) await syncService.updateData(syncId, { records: updatedRecords, batchRecords: updatedBatches });
            }}
            onDeleteAll={async () => { 
              setBatchRecords([]); 
              setRecords(prev => syncProductionWithBatches(prev, [])); 
              if (syncId) await syncService.updateData(syncId, { records: [], batchRecords: [] });
            }}
            onImportRecords={async (recs) => {
              const updatedBatches = [...recs.map(r => ({ ...r, updatedAt: new Date().toISOString() })), ...batchRecords];
              const updatedRecords = syncProductionWithBatches(records, updatedBatches);
              setBatchRecords(updatedBatches);
              setRecords(updatedRecords);
              if (syncId) await syncService.updateData(syncId, { records: updatedRecords, batchRecords: updatedBatches });
            }}
          />
        );
      case 'new-batch-characterization':
        return (
          <BatchForm
            initialData={editingBatch}
            onSave={async (r) => {
              const now = new Date().toISOString();
              const updatedBatch = { ...r, updatedAt: now };
              let updatedBatches: BatchRecord[];
              if (editingBatch) {
                updatedBatches = batchRecords.map(old => old.id === updatedBatch.id ? updatedBatch : old);
                setEditingBatch(null);
              } else {
                updatedBatches = [updatedBatch, ...batchRecords];
              }
              const updatedRecords = syncProductionWithBatches(records, updatedBatches);
              setBatchRecords(updatedBatches);
              setRecords(updatedRecords);
              setCurrentView('batch-characteristics');
              if (syncId) await syncService.updateData(syncId, { records: updatedRecords, batchRecords: updatedBatches });
            }}
            onCancel={() => { setEditingBatch(null); setCurrentView('batch-characteristics'); }}
          />
        );
      case 'aviary-details':
        return <AviaryDashboard records={records} />;
      case 'ai-reports':
        return <AIReports records={records} batchRecords={batchRecords} />;
      default:
        return <GeneralDashboard records={records} batchRecords={batchRecords} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-x-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        syncId={syncId}
        onSyncIdChange={setSyncId}
        onManualSync={performSync}
        syncStatus={syncStatus}
      />
      
      <main className="flex-1 lg:ml-64 w-full transition-all duration-300">
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 rounded-xl"><Menu size={24} /></button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tighter text-[#1e293b] uppercase">
              SIGLAB <span className="text-blue-600">AVIÁRIO</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus === 'syncing' && <CloudSync size={20} className="text-blue-500 animate-spin" />}
            {syncStatus === 'success' && <Cloud size={20} className="text-emerald-500" />}
            {syncStatus === 'error' && <CloudOff size={20} className="text-red-500" />}
            {!syncId && <CloudOff size={20} className="text-gray-300" />}
          </div>
        </header>

        <div className="p-4 md:p-8 pt-6 max-w-7xl mx-auto pb-24 lg:pb-8">
          <header className="hidden lg:flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                {currentView === 'dashboard' && 'Painel de Controle'}
                {currentView === 'new-production' && 'Lançar Produção'}
                {currentView === 'daily-records' && 'Histórico de Produção'}
                {currentView === 'batch-characteristics' && 'Gestão de Lotes'}
                {currentView === 'new-batch-characterization' && 'Caracterização de Lote'}
                {currentView === 'aviary-details' && 'Análise por Aviário'}
                {currentView === 'ai-reports' && 'Relatórios com IA'}
              </h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {syncId && <span className="ml-4 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] border border-emerald-100 uppercase tracking-widest font-black">Nuvem Ativa</span>}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
               {syncId && (
                <button 
                  onClick={performSync}
                  title="Sincronizar Manualmente"
                  className={`p-3 rounded-2xl border border-gray-100 bg-white transition-all shadow-sm ${syncStatus === 'syncing' ? 'animate-spin text-blue-500' : 'text-slate-400 hover:text-blue-600'}`}
                >
                  <CloudSync size={20} />
                </button>
              )}
              {currentView !== 'new-production' && (
                <button 
                  onClick={() => handleNavigate('new-production')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus size={18} /> Novo Registro
                </button>
              )}
            </div>
          </header>

          <div className="w-full">
            {renderContent()}
          </div>
        </div>

        {currentView !== 'new-production' && currentView !== 'new-batch-characterization' && (
          <button 
            onClick={() => handleNavigate('new-production')}
            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-20 border-4 border-white"
          >
            <Plus size={28} />
          </button>
        )}
      </main>
    </div>
  );
};

export default App;
