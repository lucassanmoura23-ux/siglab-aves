
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ProductionForm } from './components/ProductionForm';
import { DailyRecords } from './components/DailyRecords';
import { BatchCharacteristics } from './components/BatchCharacteristics';
import { BatchForm } from './components/BatchForm';
import { AviaryDashboard } from './components/AviaryDashboard';
import { GeneralDashboard } from './components/GeneralDashboard';
import { AIReports } from './components/AIReports';
import { ViewState, ProductionRecord, BatchRecord } from './types';
import { LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
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

  const handleImportRecords = (newRecords: ProductionRecord[]) => {
    setRecords(prev => [...newRecords, ...prev]);
  };

  const handleCancelForm = () => {
    setEditingRecord(null);
    setCurrentView('daily-records');
  };

  const handleEditRecord = (record: ProductionRecord) => {
    setEditingRecord(record);
    setCurrentView('new-production');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteAll = () => {
    setRecords([]);
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

  const handleDeleteAllBatches = () => {
    setBatchRecords([]);
    setRecords(prev => syncProductionWithBatches(prev, []));
  };

  const handleImportBatches = (newRecords: BatchRecord[]) => {
    const updatedBatches = [...newRecords, ...batchRecords];
    setBatchRecords(updatedBatches);
    setRecords(prev => syncProductionWithBatches(prev, updatedBatches));
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'new-production') setEditingRecord(null);
    if (view === 'new-batch-characterization') setEditingBatch(null);
    setCurrentView(view);
  };

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
            onCancel={handleCancelForm}
          />
        );
      case 'daily-records':
        return (
          <DailyRecords 
            records={records} 
            batchRecords={batchRecords}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onDeleteAll={handleDeleteAll}
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
            onDeleteAll={handleDeleteAllBatches}
            onImportRecords={handleImportBatches}
          />
        );
      case 'new-batch-characterization':
        return (
          <BatchForm
            initialData={editingBatch}
            onSave={handleSaveBatch}
            onCancel={() => {
              setEditingBatch(null);
              setCurrentView('batch-characteristics');
            }}
          />
        );
      case 'aviary-details':
        return <AviaryDashboard records={records} />;
      case 'ai-reports':
        return <AIReports records={records} batchRecords={batchRecords} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[600px] text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
            <LayoutGrid size={48} className="text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-600">Em Breve</h2>
            <button onClick={() => handleNavigate('dashboard')} className="mt-4 text-blue-600 hover:underline">Voltar ao Dashboard</button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="w-full max-w-[98%] mx-auto pb-10">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavigate('dashboard')}>
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-md transition-transform hover:scale-110">
                <svg viewBox="0 0 100 100" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" stroke="#0891b2" strokeWidth="2" strokeDasharray="2 4" />
                  <path d="M35 45 L50 35 L65 45 L65 65 L35 65 Z" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-[#1e293b] tracking-tight uppercase">
                SIGLAB <span className="bg-gradient-to-r from-cyan-600 to-emerald-500 bg-clip-text text-transparent">AVIÁRIO</span>
              </h1>
            </div>
            <div className="flex text-[10px] font-black text-gray-400 items-center uppercase tracking-widest">
              <span className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-blue-600 font-black">
                SISTEMA v1.5.0 PREMIUM
              </span>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
