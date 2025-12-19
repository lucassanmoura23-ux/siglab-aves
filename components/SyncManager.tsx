
import React, { useState } from 'react';
import { Cloud, Link, Smartphone, Laptop, CheckCircle2, AlertCircle, Copy, RefreshCcw, Wifi } from 'lucide-react';

interface SyncManagerProps {
  currentKey: string;
  onUpdateKey: (key: string) => void;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ currentKey, onUpdateKey }) => {
  const [inputKey, setInputKey] = useState(currentKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!inputKey.trim() || inputKey.length < 3) {
      alert("Por favor, digite um código com pelo menos 3 caracteres.");
      return;
    }
    onUpdateKey(inputKey.toUpperCase().trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInputKey(result);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg">
          <Wifi size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Sincronização Online</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
          O que você salvar aqui aparecerá em qualquer outro celular ou computador que use o <strong>mesmo código</strong>.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Código da sua Granja</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Ex: MINHA-GRANJA-01"
              className="flex-1 bg-gray-50 border border-gray-200 px-4 py-4 rounded-2xl font-black text-lg text-blue-600 tracking-widest uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            />
            <button 
              onClick={generateRandomKey}
              title="Gerar código aleatório"
              className="p-4 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-2 ${
            isSaved ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
          }`}
        >
          {isSaved ? <CheckCircle2 size={18} /> : <Link size={18} />}
          {isSaved ? 'CÓDIGO ATIVADO!' : 'CONECTAR DISPOSITIVOS'}
        </button>

        {currentKey && (
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <Cloud size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Nuvem Ativa</p>
                <p className="text-sm font-black text-emerald-600 tracking-wider">{currentKey}</p>
              </div>
            </div>
            <button 
              onClick={() => { navigator.clipboard.writeText(currentKey); alert("Código copiado!"); }}
              className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest"
            >
              Copiar
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
        <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={14} /> Como Sincronizar Agora?
        </h4>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
            <p className="text-xs text-blue-800">No seu <strong>Notebook</strong>, escolha um código e clique em "Conectar".</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
            <p className="text-xs text-blue-800">No seu <strong>Celular</strong>, entre nesta tela e digite o <strong>mesmo código</strong>.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">3</div>
            <p className="text-xs text-blue-800">Pronto! Os dados de produção serão atualizados automaticamente via internet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
