
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
import { Menu, Plus, LayoutGrid } from 'lucide-react';

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
    // Se não houver registros e estiver no dashboard, mostra um estado vazio amigável
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
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Drawer no mobile, Fixo no Desktop) */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 lg:ml-64 w-full transition-all duration-300">
        {/* Header Mobile Otimizado */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 active:bg-slate-100 rounded-xl transition-all"
            aria-label="Abrir Menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tighter text-[#1e293b] uppercase">
              SIGLAB <span className="text-blue-600">AVIÁRIO</span>
            </h1>
          </div>
          
          <div className="w-10"></div>
        </header>

        <div className="p-4 md:p-8 pt-6 max-w-7xl mx-auto pb-24 lg:pb-8">
          {/* Título da Visão no Desktop */}
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
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            {currentView !== 'new-production' && (
              <button 
                onClick={() => handleNavigate('new-production')}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={18} /> Novo Registro
              </button>
            )}
          </header>

          <div className="w-full">
            {renderContent()}
          </div>
        </div>

        {/* Botão Flutuante (FAB) apenas no Mobile para acesso rápido ao Novo Registro */}
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
