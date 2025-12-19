
import React from 'react';
import { 
  LayoutGrid, 
  LineChart, 
  ClipboardList, 
  PlusCircle, 
  Box, 
  FileText,
  X
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  
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

  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 shadow-2xl lg:shadow-xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Header / Logo Area */}
      <div className="p-8 lg:p-10 flex flex-col items-center border-b border-gray-50 bg-gradient-to-b from-gray-50 to-white relative">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-black tracking-tighter text-[#1e293b]">
            SIG<span className="text-blue-600">LAB</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-px w-3 bg-gray-200"></div>
            <p className="text-gray-400 text-[10px] font-black tracking-[0.3em] uppercase">Aviário</p>
            <div className="h-px w-3 bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-3 opacity-80">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNavigate(item.id as ViewState)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
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

      {/* Footer / Developers */}
      <div className="p-6 border-t border-gray-50 bg-gray-50/50 space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-60 text-center">Desenvolvimento</p>
            
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-800 leading-tight">Lucas Santana de Moura</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Administrador - CRA-MT: 20-09385</p>
              </div>

              <div className="text-center">
                <p className="text-[10px] font-black text-gray-800 leading-tight">Lucas Henrique Costa Modesto</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Estagiário - IFMT (SVC)</p>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-2">
            <p className="text-[8px] font-black text-blue-600/50 uppercase tracking-tighter">v1.5.0 Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
};
