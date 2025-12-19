
import React, { useState, useRef } from 'react';
import { 
  ClipboardCheck, 
  Upload, 
  Download, 
  Trash2, 
  PlusCircle, 
  Bird,
  ChevronDown,
  ChevronUp,
  Edit
} from 'lucide-react';
import { BatchRecord, ProductionRecord } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface BatchCharacteristicsProps {
  records: BatchRecord[];
  productionRecords: ProductionRecord[];
  onNewRecord: () => void;
  onEditRecord: (record: BatchRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAll: () => void;
  onImportRecords: (records: BatchRecord[]) => void;
}

export const BatchCharacteristics: React.FC<BatchCharacteristicsProps> = ({
  records,
  productionRecords,
  onNewRecord,
  onEditRecord,
  onDeleteRecord,
  onDeleteAll,
  onImportRecords
}) => {
  const [expandedAviary, setExpandedAviary] = useState<string | null>('1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'single' | 'all'>('single');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const aviaries = ['1', '2', '3', '4'];

  const toggleAviary = (id: string) => {
    setExpandedAviary(prev => prev === id ? null : id);
  };

  const getAviaryRecords = (aviaryId: string) => {
    return records
      .filter(r => r.aviaryId === aviaryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCurrentBirds = (aviaryId: string) => {
    const latestProduction = productionRecords
      .filter(p => p.aviaryId === aviaryId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return latestProduction ? latestProduction.liveBirds : 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || !dateString.includes('-')) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleRequestDelete = (id: string) => {
    setModalType('single');
    setSelectedRecordId(id);
    setIsModalOpen(true);
  };

  const handleRequestDeleteAll = () => {
    setModalType('all');
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (modalType === 'single' && selectedRecordId) {
      onDeleteRecord(selectedRecordId);
    } else if (modalType === 'all') {
      onDeleteAll();
    }
  };

  const handleExportCSV = () => {
     if (records.length === 0) { alert("Não há dados."); return; }
    const headers = ["Data", "Aviario", "Lote", "Idade (Sem)", "Peso (g)", "Uniformidade", "Empenamento"];
    const csvRows = [headers.join(';'), ...records.map(r => [r.date, r.aviaryId, r.batchId, r.ageWeeks, r.weight, r.uniformity, r.feathering].join(';'))];
    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lotes_siglab_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      try {
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length < 2) return;

        const newRecords: BatchRecord[] = [];
        const firstLine = lines[0].toLowerCase();
        let separator = firstLine.includes(';') ? ';' : ',';
        if (!firstLine.includes(';') && !firstLine.includes(',') && firstLine.includes('\t')) separator = '\t';

        const parseDateFlexible = (dateStr: string) => {
          if (!dateStr) return null;
          // YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          // DD/MM/YYYY
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split('/');
            return `${y}-${m}-${d}`;
          }
          return null;
        };

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
          
          // Busca a data nas primeiras colunas (flexibilidade para IDs extras)
          let date = null;
          let dateColIndex = -1;

          for (let j = 0; j < Math.min(cols.length, 3); j++) {
            const potentialDate = parseDateFlexible(cols[j]);
            if (potentialDate) {
              date = potentialDate;
              dateColIndex = j;
              break;
            }
          }

          if (!date) continue;

          newRecords.push({
            id: crypto.randomUUID(),
            date: date,
            aviaryId: (cols[dateColIndex + 1] || '1').replace(/\D/g, ''),
            batchId: cols[dateColIndex + 2] || 'S/L',
            ageWeeks: Number(cols[dateColIndex + 3]) || 0,
            currentBirds: 0,
            weight: Number(cols[dateColIndex + 4]) || 0,
            uniformity: Number(cols[dateColIndex + 5]) || 0,
            feathering: (cols[dateColIndex + 6] || 'Bom') as any,
          });
        }
        
        if (newRecords.length > 0) {
          onImportRecords(newRecords);
          alert(`${newRecords.length} registros de lote importados com sucesso!`);
        } else {
          alert("Arquivo sem dados de lote válidos. Verifique se as datas estão como DD/MM/AAAA ou AAAA-MM-DD.");
        }
      } catch (err) { 
        alert("Erro ao ler o arquivo. Certifique-se que é um CSV válido."); 
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input 
        type="file" 
        accept=".csv, text/csv, .txt, application/vnd.ms-excel" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmDelete} message={modalType === 'all' ? "Deseja apagar todos os lotes?" : "Deseja excluir este registro de lote?"} />

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><ClipboardCheck size={28} /></div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Caracterização do Lote</h2>
            <p className="text-sm text-gray-500 font-medium">Histórico de vida e métricas zootécnicas.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-50"><Upload size={16} /> Importar</button>
          <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-blue-50"><Download size={16} /> Exportar</button>
          <button onClick={handleRequestDeleteAll} className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"><Trash2 size={16} /> Limpar</button>
          <button onClick={onNewRecord} className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-3 bg-[#1e293b] text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"><PlusCircle size={16} /> Novo Lote</button>
        </div>
      </div>

      <div className="space-y-4">
        {aviaries.map((aviaryId) => {
          const isExpanded = expandedAviary === aviaryId;
          const aviaryRecords = getAviaryRecords(aviaryId);
          const currentBirds = getCurrentBirds(aviaryId);
          
          return (
            <div key={aviaryId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
              <div onClick={() => toggleAviary(aviaryId)} className={`p-5 flex justify-between items-center cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isExpanded ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><Bird size={24} /></div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Aviário {aviaryId}</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{currentBirds.toLocaleString()} AVES VIVAS</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {isExpanded ? 'Ocultar' : 'Expandir'} {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-50 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Lote</th>
                        <th className="px-6 py-4 text-center">Semanas</th>
                        <th className="px-6 py-4 text-center">Peso (g)</th>
                        <th className="px-6 py-4 text-center">Unif %</th>
                        <th className="px-6 py-4 text-center">Pena</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[11px] font-bold text-gray-700">
                      {aviaryRecords.length > 0 ? aviaryRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.date)}</td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase">{record.batchId}</span></td>
                          <td className="px-6 py-4 text-center">{record.ageWeeks}</td>
                          <td className="px-6 py-4 text-center text-blue-600">{record.weight}</td>
                          <td className="px-6 py-4 text-center text-emerald-600">{record.uniformity}%</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${record.feathering === 'Excelente' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{record.feathering}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={(e) => { e.stopPropagation(); onEditRecord(record); }} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleRequestDelete(record.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">Sem histórico de lotes</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
