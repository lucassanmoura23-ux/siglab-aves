
import React, { useState } from 'react';
import { 
  LayoutGrid, 
  LineChart, 
  ClipboardList, 
  PlusCircle, 
  Box, 
  FileText,
  X,
  Cloud,
  RefreshCw,
  Key,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { ViewState } from '../types';
import { syncService } from '../services/syncService';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen?: boolean;
  onClose?: () => void;
  syncId: string;
  onSyncIdChange: (id: string) => void;
  onManualSync: () => void;
  syncStatus: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  isOpen, 
  onClose,
  syncId,
  onSyncIdChange,
  onManualSync,
  syncStatus
}) => {
  const [tempSyncId, setTempSyncId] = useState(syncId);
  const [copied, setCopied] = useState(false);

  const menuGroups = [
    {
      title: 'PAINÉIS',
      items: [
        { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutGrid },
        { id: 'aviary-details', label: 'Por Aviário', icon: LineChart },
      ]
    },
    {
      title: 'GESTÃO',
      items: [
        { id: 'daily-records', label: 'Registros Diários', icon: ClipboardList },
        { id: 'new-production', label: 'Lançar Produção', icon: PlusCircle },
      ]
    },
    {
      title: 'CONTROLE ZOOTÉCNICO',
      items: [
        { id: 'batch-characteristics', label: 'Caracterização Lotes', icon: Box },
      ]
    },
    {
      title: 'ANÁLISES',
      items: [
        { id: 'ai-reports', label: 'Relatórios IA', icon: FileText },
      ]
    }
  ];

  const handleGenerateKey = async () => {
    if (confirm("Deseja criar uma nova chave de sincronismo? Isso iniciará um repositório vazio na nuvem.")) {
      const newId = await syncService.createCloudStorage({ records: [], batchRecords: [] });
      if (newId) {
        onSyncIdChange(newId);
        setTempSyncId(newId);
        alert("Nova chave gerada! Use este código em todos os seus dispositivos.");
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0
      ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 flex flex-col items-center border-b border-gray-50 bg-gray-50/30 relative">
        <button onClick={onClose} className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500"><X size={20} /></button>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black tracking-tighter text-[#1e293b]">
            SIG<span className="text-blue-600">LAB</span>
          </h2>
          <p className="text-gray-400 text-[9px] font-black tracking-[0.2em] uppercase mt-1">Gestão Aviária</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto pb-10">
        {/* Cloud Sync Config Section */}
        <div className="px-3">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-80 flex items-center gap-2">
            <Cloud size={10} className="text-blue-500" /> Sincronismo Nuvem
          </h3>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
            {!syncId ? (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-500 leading-tight">Conecte seus dispositivos (Celular + PC)</p>
                <input 
                  type="text" 
                  placeholder="Cole sua Chave"
                  className="w-full px-2 py-2 text-[10px] font-black uppercase tracking-tighter border border-slate-200 rounded bg-white outline-none focus:ring-1 focus:ring-blue-400"
                  value={tempSyncId}
                  onChange={(e) => setTempSyncId(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onSyncIdChange(tempSyncId)} className="bg-blue-600 text-white p-2 rounded text-[8px] font-black uppercase hover:bg-blue-700">Conectar</button>
                  <button onClick={handleGenerateKey} className="bg-white border border-slate-200 text-slate-600 p-2 rounded text-[8px] font-black uppercase hover:bg-slate-50">Novo</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="text-[8px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-widest">
                    <CheckCircle2 size={10} /> Conectado
                   </span>
                   <button onClick={() => { onSyncIdChange(''); setTempSyncId(''); }} className="text-[8px] font-black text-red-500 uppercase hover:underline">Sair</button>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 bg-white border border-slate-200 p-2 rounded text-[9px] font-black text-slate-400 truncate tracking-tight">{syncId}</div>
                  <button onClick={handleCopy} className="p-2 text-blue-500 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <button 
                  onClick={onManualSync} 
                  disabled={syncStatus === 'syncing'}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded text-[8px] font-black uppercase tracking-widest hover:bg-slate-50"
                >
                  <RefreshCw size={10} className={syncStatus === 'syncing' ? 'animate-spin' : ''} /> 
                  Sincronizar Agora
                </button>
              </div>
            )}
          </div>
        </div>

        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 px-3 opacity-80">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { onNavigate(item.id as ViewState); if (onClose) onClose(); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${
                        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-5 border-t border-gray-100 bg-gray-50/50">
        <div className="text-center space-y-4">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Desenvolvido por</p>
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-800 leading-tight">Lucas Santana de Moura</span>
              <span className="text-[8px] font-bold text-blue-600 mt-0.5">Administrador</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-800 leading-tight">Lucas Henrique Costa Modesto</span>
              <span className="text-[8px] font-bold text-blue-600 mt-0.5">Estagiário</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
