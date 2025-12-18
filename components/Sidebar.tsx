
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
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-50 shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Close Button Mobile Only */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl lg:hidden text-gray-400"
        >
          <X size={20} />
        </button>

        {/* Header / Logo Area */}
        <div className="p-8 flex flex-col items-center border-b border-gray-50 bg-gradient-to-b from-gray-50 to-white">
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
        <div className="flex-1 py-8 px-4 space-y-8">
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
        <div className="p-6 border-t border-gray-50 bg-gray-50/50 space-y-4">
          <div className="flex items-center justify-between">
             <span className="text-[9px] font-black text-blue-900 opacity-40 uppercase tracking-widest">System Status</span>
             <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
             </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60 text-center">Desenvolvimento</p>
              <div className="space-y-2 text-center">
                <div>
                  <p className="text-[10px] font-black text-gray-800 leading-tight">Lucas Santana de Moura</p>
                  <p className="text-[8px] font-bold text-gray-500 leading-tight">Administrador</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-800 leading-tight">Lucas Henrique C. Modesto</p>
                  <p className="text-[8px] font-bold text-gray-500 leading-tight">Estagiário - IFMT (SVC)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200/50">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">v1.5.0 Premium Edition</p>
          </div>
        </div>
      </div>
    </>
  );
};
