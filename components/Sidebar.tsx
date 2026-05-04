
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
      fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0
      ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Header / Logo Area */}
      <div className="p-8 flex flex-col items-center border-b border-gray-50 bg-gray-50/30 relative">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black tracking-tighter text-[#1e293b]">
            SIG<span className="text-blue-600">LAB</span>
          </h2>
          <p className="text-gray-400 text-[9px] font-black tracking-[0.2em] uppercase mt-1">Gestão Aviária</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
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
                      onClick={() => {
                        onNavigate(item.id as ViewState);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
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

      {/* Footer / Developers Updated */}
      <div className="p-5 border-t border-gray-100 bg-gray-50/50">
        <div className="text-center space-y-4">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Desenvolvido por</p>
          
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-800 leading-tight">Lucas Santana de Moura</span>
              <span className="text-[8px] font-bold text-blue-600 mt-0.5">Administrador</span>
              <span className="text-[7px] font-medium text-gray-400 italic">CRA-MT: 20-09385</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-800 leading-tight">Lucas Henrique Costa Modesto</span>
              <span className="text-[8px] font-bold text-blue-600 mt-0.5">Estagiário</span>
              <span className="text-[7px] font-medium text-gray-400 italic">IFMT (SVC)</span>
            </div>
          </div>
          
          <div className="pt-1 opacity-40">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">SIGLAB v1.5.0 PREMIUM</p>
          </div>
        </div>
      </div>
    </div>
  );
};
