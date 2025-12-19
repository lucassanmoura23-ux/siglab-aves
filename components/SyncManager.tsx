
import React, { useState } from 'react';
import { Cloud, Link, Smartphone, Laptop, CheckCircle2, AlertCircle, Copy, RefreshCcw } from 'lucide-react';

interface SyncManagerProps {
  currentKey: string;
  onUpdateKey: (key: string) => void;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ currentKey, onUpdateKey }) => {
  const [inputKey, setInputKey] = useState(currentKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!inputKey.trim()) {
      alert("Por favor, digite uma chave de acesso.");
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentKey);
    alert("Código copiado!");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Cloud size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Conectar Dispositivos</h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Use o mesmo código abaixo em todos os seus aparelhos para que os dados sejam sincronizados automaticamente.
        </p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Seu Código de Acesso</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Ex: FAZENDA-MODELO-01"
              className="flex-1 bg-gray-50 border border-gray-200 px-4 py-4 rounded-2xl font-black text-lg text-blue-600 tracking-widest uppercase outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            />
            <button 
              onClick={generateRandomKey}
              title="Gerar chave aleatória"
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
          {isSaved ? 'Conectado com Sucesso!' : 'Conectar Agora'}
        </button>

        {currentKey && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={20} />
              <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase">Sincronização Ativa</p>
                <p className="text-xs font-bold text-emerald-600">{currentKey}</p>
              </div>
            </div>
            <button onClick={copyToClipboard} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors">
              <Copy size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white p-6 rounded-3xl border border-gray-100">
          <Laptop size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-[10px] font-black text-gray-800 uppercase">Notebook</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100">
          <Smartphone size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-[10px] font-black text-gray-800 uppercase">Celular</p>
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <AlertCircle className="text-amber-600 shrink-0" size={18} />
        <p className="text-[10px] font-bold text-amber-800 leading-tight">
          IMPORTANTE: Não compartilhe seu código com estranhos. Quem tiver seu código poderá ver e alterar todos os seus registros de produção.
        </p>
      </div>
    </div>
  );
};
