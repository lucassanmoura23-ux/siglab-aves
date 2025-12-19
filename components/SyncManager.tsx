
import React, { useState } from 'react';
import { Wifi, Cloud, Smartphone, Laptop, CheckCircle2, Link, AlertTriangle, RefreshCw } from 'lucide-react';

interface SyncManagerProps {
  currentKey: string;
  onUpdateKey: (key: string) => void;
  onForceSync: () => void;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle';
}

export const SyncManager: React.FC<SyncManagerProps> = ({ currentKey, onUpdateKey, onForceSync, syncStatus }) => {
  const [inputKey, setInputKey] = useState(currentKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (inputKey.length < 4) {
      alert("O código deve ter pelo menos 4 caracteres.");
      return;
    }
    onUpdateKey(inputKey.toUpperCase().trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg">
          <Wifi size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Conectar Dispositivos</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
          Sincronize seu celular e seu computador. Use o mesmo código em todos os aparelhos para acessar os mesmos dados.
        </p>
      </div>

      {/* Input de Chave */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Código de Acesso Único</label>
          <input 
            type="text" 
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Ex: MINHA-GRANJA-2024"
            className="w-full bg-gray-50 border border-gray-200 px-6 py-4 rounded-2xl font-black text-xl text-blue-600 tracking-widest uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>

        <button 
          onClick={handleSave}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 ${
            isSaved ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
          }`}
        >
          {isSaved ? <CheckCircle2 size={18} /> : <Link size={18} />}
          {isSaved ? 'CÓDIGO SALVO!' : 'ATIVAR SINCRONIZAÇÃO'}
        </button>

        {currentKey && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={onForceSync}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              Forçar Atualização Agora
            </button>
          </div>
        )}
      </div>

      {/* Como funciona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
          <Laptop className="text-gray-300" size={32} />
          <div>
            <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Computador</p>
            <p className="text-xs font-bold text-gray-400">Dados centralizados</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
          <Smartphone className="text-gray-300" size={32} />
          <div>
            <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Celular</p>
            <p className="text-xs font-bold text-gray-400">Coleta em campo</p>
          </div>
        </div>
      </div>

      {/* Alerta */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
        <p className="text-[10px] font-bold text-amber-800 leading-tight">
          IMPORTANTE: Qualquer pessoa com seu código pode ver e alterar seus dados. Escolha um código difícil de adivinhar.
        </p>
      </div>
    </div>
  );
};
