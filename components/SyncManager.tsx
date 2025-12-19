
import React, { useState } from 'react';
import { Wifi, CloudDownload, CloudUpload, Smartphone, Laptop, CheckCircle2, AlertTriangle, RefreshCw, Save, DownloadCloud } from 'lucide-react';

interface SyncManagerProps {
  currentKey: string;
  onUpdateKey: (key: string) => void;
  onManualPush: () => void;
  onManualPull: () => void;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle';
}

export const SyncManager: React.FC<SyncManagerProps> = ({ currentKey, onUpdateKey, onManualPush, onManualPull, syncStatus }) => {
  const [inputKey, setInputKey] = useState(currentKey);
  const [isKeySaved, setIsKeySaved] = useState(false);

  const handleSaveKey = () => {
    if (inputKey.length < 2) {
      alert("O código deve ter pelo menos 2 caracteres.");
      return;
    }
    onUpdateKey(inputKey.toUpperCase().trim());
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Card de Configuração do Código */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Wifi size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Sincronizar Dispositivos</h2>
          <p className="text-gray-500 text-xs font-medium max-w-sm mx-auto">
            Use o mesmo código no celular e no computador para compartilhar seus registros.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left px-1">Seu Código de Acesso</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Ex: IFMT"
              className="flex-1 bg-gray-50 border border-gray-200 px-5 py-4 rounded-2xl font-black text-xl text-blue-600 tracking-widest uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            />
            <button 
              onClick={handleSaveKey}
              className={`px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${
                isKeySaved ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {isKeySaved ? <CheckCircle2 size={18} /> : 'SALVAR CÓDIGO'}
            </button>
          </div>
        </div>
      </div>

      {/* Botões de Ação - Salvar e Buscar */}
      {currentKey && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={onManualPush}
            disabled={syncStatus === 'syncing'}
            className="group flex flex-col items-center justify-center gap-4 p-10 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] shadow-2xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
              <CloudUpload size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-sm uppercase tracking-[0.2em]">SALVAR NA NUVEM</p>
              <p className="text-[10px] opacity-70 font-bold mt-1">Envia os dados deste aparelho</p>
            </div>
          </button>

          <button 
            onClick={onManualPull}
            disabled={syncStatus === 'syncing'}
            className="group flex flex-col items-center justify-center gap-4 p-10 bg-white border-4 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-[2rem] shadow-2xl shadow-blue-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="p-4 bg-blue-100 rounded-2xl group-hover:scale-110 transition-transform">
              <DownloadCloud size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-sm uppercase tracking-[0.2em]">BUSCAR DA NUVEM</p>
              <p className="text-[10px] opacity-70 font-bold mt-1">Baixa os dados salvos na internet</p>
            </div>
          </button>
        </div>
      )}

      {/* Status da Conexão */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
            syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
            syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
          }`} />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            STATUS: {
              syncStatus === 'synced' ? 'Nuvem Conectada e Sincronizada' : 
              syncStatus === 'syncing' ? 'Processando... Aguarde' :
              syncStatus === 'error' ? 'Erro de Conexão' : 'Aguardando Código'
            }
          </span>
        </div>
        {syncStatus === 'syncing' && <RefreshCw size={16} className="text-blue-500 animate-spin" />}
      </div>

      {/* Guia Rápido */}
      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
        <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={14} /> Importante para o sucesso:
        </h4>
        <ul className="text-[11px] font-bold text-amber-800/80 space-y-2 leading-tight">
          <li>1. No Computador: Digite o código e clique em <strong>SALVAR NA NUVEM</strong>.</li>
          <li>2. No Celular: Digite o MESMO código e clique em <strong>BUSCAR DA NUVEM</strong>.</li>
          <li>3. Repita o processo sempre que quiser atualizar os dados entre um e outro.</li>
        </ul>
      </div>
    </div>
  );
};
