
import React, { useState, useEffect } from 'react';
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
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [records, setRecords] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem('siglab_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);

  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>(() => {
    const saved = localStorage.getItem('siglab_batch_records');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);

  useEffect(() => {
    localStorage.setItem('siglab_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('siglab_batch_records', JSON.stringify(batchRecords));
  }, [batchRecords]);

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
            onDeleteAll={() => { setBatchRecords([]); setRecords(prev => syncProductionWithBatches(prev, [])); }}
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
            onSave={(r) => {
              let updatedBatches: BatchRecord[];
              if (editingBatch) {
                updatedBatches = batchRecords.map(old => old.id === r.id ? r : old);
                setEditingBatch(null);
              } else {
                updatedBatches = [r, ...batchRecords];
              }
              setBatchRecords(updatedBatches);
              setRecords(prev => syncProductionWithBatches(prev, updatedBatches));
              setCurrentView('batch-characteristics');
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
      {/* Sidebar Overlay no Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar content */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className={`flex-1 transition-all duration-300 lg:ml-64 w-full`}>
        <div className="p-4 md:p-8 pt-6">
          <header className="flex justify-between items-center mb-8 bg-white/50 p-2 rounded-2xl backdrop-blur-sm lg:bg-transparent lg:p-0">
            <div className="flex items-center gap-3">
              {/* Botão Menu Mobile no Cabeçalho */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Menu"
              >
                <Menu size={24} />
              </button>
              
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleNavigate('dashboard')}>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-8 md:h-8" fill="white">
                    <path d="M35 45 L50 35 L65 45 L65 65 L35 65 Z" fill="white" />
                  </svg>
                </div>
                <h1 className="text-lg md:text-xl font-black text-[#1e293b] tracking-tighter uppercase">
                  SIGLAB <span className="text-blue-600">AVIÁRIO</span>
                </h1>
              </div>
            </div>
            
            <div className="hidden sm:block">
               <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">
                v1.5.0 Premium
              </span>
            </div>
          </header>

          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
