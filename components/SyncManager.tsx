
import React, { useState } from 'react';
import { Share2, Copy, Download, Upload, CheckCircle2, AlertTriangle, Smartphone, Laptop } from 'lucide-react';

interface SyncManagerProps {
  onImport: (data: { records: any[], batchRecords: any[] }) => void;
  exportData: () => { records: any[], batchRecords: any[] };
}

export const SyncManager: React.FC<SyncManagerProps> = ({ onImport, exportData }) => {
  const [syncToken, setSyncToken] = useState('');
  const [importToken, setImportToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerateToken = () => {
    const data = exportData();
    const stringified = JSON.stringify(data);
    // Usando btoa para uma codificação simples em base64 (ajustado para unicode)
    const encoded = btoa(unescape(encodeURIComponent(stringified)));
    setSyncToken(encoded);
    setStatus('idle');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(syncToken);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleImport = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importToken)));
      const data = JSON.parse(decoded);
      if (data.records && data.batchRecords) {
        onImport(data);
        setStatus('success');
        setImportToken('');
      } else {
        throw new Error("Formato inválido");
      }
    } catch (e) {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Share2 size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Conectar Dispositivos</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Transfira seus dados entre o notebook e o celular de forma rápida e segura sem necessidade de internet constante.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar do Notebook */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Laptop size={20} />
            </div>
            <h3 className="font-black text-sm text-gray-800 uppercase tracking-widest">Enviar do Notebook</h3>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Clique no botão abaixo para gerar o código de sincronização com todos os seus dados atuais.
          </p>

          {!syncToken ? (
            <button 
              onClick={handleGenerateToken}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Gerar Código de Sincronização
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 break-all text-[10px] font-mono text-gray-400 max-h-32 overflow-y-auto">
                {syncToken}
              </div>
              <button 
                onClick={handleCopyToken}
                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
              >
                {status === 'success' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {status === 'success' ? 'Copiado para Área de Transferência!' : 'Copiar Código'}
              </button>
              <p className="text-[10px] text-center text-amber-600 font-bold uppercase">
                Envie este código para o seu celular (via WhatsApp, Email, etc).
              </p>
            </div>
          )}
        </div>

        {/* Importar no Celular */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Smartphone size={20} />
            </div>
            <h3 className="font-black text-sm text-gray-800 uppercase tracking-widest">Receber no Celular</h3>
          </div>
          
          <p className="text-xs text-gray-500 leading-relaxed">
            Cole o código de sincronização gerado no outro dispositivo para atualizar este aplicativo.
          </p>

          <textarea 
            value={importToken}
            onChange={(e) => setImportToken(e.target.value)}
            placeholder="Cole o código aqui..."
            className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <button 
            onClick={handleImport}
            disabled={!importToken}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              !importToken ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
            }`}
          >
            Sincronizar Agora
          </button>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
              <AlertTriangle size={14} /> Código Inválido ou Corrompido
            </div>
          )}
          {status === 'success' && !syncToken && (
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
              <CheckCircle2 size={14} /> Dados Sincronizados com Sucesso!
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
        <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2">Como funciona?</h4>
        <ul className="text-xs text-blue-800 space-y-2 opacity-80 leading-relaxed">
          <li>1. No <strong>Notebook</strong>: Gere o código e copie-o.</li>
          <li>2. No <strong>Celular</strong>: Abra esta mesma tela e cole o código.</li>
          <li>3. O SIGLAB unificará os dados e salvará no armazenamento interno do celular.</li>
        </ul>
      </div>
    </div>
  );
};
