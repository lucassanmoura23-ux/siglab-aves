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
  
  // Modal State
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
    // Get the most recent production record for this aviary
    const latestProduction = productionRecords
      .filter(p => p.aviaryId === aviaryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return latestProduction ? latestProduction.liveBirds : 0;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // --- Handlers ---

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

  // --- Import/Export ---
  const handleExportCSV = () => {
     if (records.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    const headers = ["Data", "Aviario", "Lote", "Idade (Sem)", "Peso (g)", "Uniformidade", "Empenamento"];
    const csvRows = [
      headers.join(';'),
      ...records.map(r => [
        r.date, r.aviaryId, r.batchId, r.ageWeeks, r.weight, r.uniformity, r.feathering
      ].join(';'))
    ];
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `lotes_aviario_${new Date().toISOString().split('T')[0]}.csv`);
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
        const lines = text.split('\n');
        const newRecords: BatchRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const separator = line.includes(';') ? ';' : ',';
          const cols = line.split(separator).map(c => c.replace(/"/g, '').trim());
          if (cols.length < 5) continue;

          newRecords.push({
            id: crypto.randomUUID(),
            date: cols[0],
            aviaryId: cols[1],
            batchId: cols[2],
            ageWeeks: Number(cols[3]) || 0,
            currentBirds: 0, // Calculated from production records now
            weight: Number(cols[5]) || 0,
            uniformity: Number(cols[6]) || 0,
            feathering: (cols[7] as any) || 'Bom',
          });
        }
        if (newRecords.length > 0) onImportRecords(newRecords);
        else alert("Formato inválido.");
      } catch (err) {
        alert("Erro ao importar CSV.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <input 
        type="file" 
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={modalType === 'all' ? "Apagar Tudo" : "Confirmação"}
        message={modalType === 'all' ? "Deseja apagar todos os lotes?" : "Deseja excluir este registro de lote?"}
      />

      {/* Header Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Caracterização do Lote</h2>
            <p className="text-sm text-gray-500">Gestão de lotes e histórico por aviário.</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Upload size={16} /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button 
            onClick={handleRequestDeleteAll}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            <Trash2 size={16} /> <span className="hidden sm:inline">Apagar Tudo</span>
          </button>
          <button 
            onClick={onNewRecord}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <PlusCircle size={16} /> Nova Caracterização
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {aviaries.map((aviaryId) => {
          const isExpanded = expandedAviary === aviaryId;
          const records = getAviaryRecords(aviaryId);
          const currentBirds = getCurrentBirds(aviaryId);
          
          return (
            <div key={aviaryId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
              {/* Accordion Header */}
              <div 
                onClick={() => toggleAviary(aviaryId)}
                className={`p-5 flex justify-between items-center cursor-pointer hover:bg-blue-50/50 transition-colors ${isExpanded ? 'bg-blue-50/30 border-b border-blue-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Bird size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Aviário {aviaryId}</h3>
                    <p className="text-sm text-gray-500">
                      Saldo Atual: <span className="font-bold text-gray-900">{currentBirds.toLocaleString()} aves</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-wide">
                  {isExpanded ? 'Ocultar Lotes' : 'Ver Lotes'}
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                        <tr>
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Lote</th>
                          <th className="px-6 py-4 text-center">Idade (Sem.)</th>
                          <th className="px-6 py-4 text-center">Peso (g)</th>
                          <th className="px-6 py-4 text-center">Uniformidade</th>
                          <th className="px-6 py-4 text-center">Empenamento</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {records.length > 0 ? (
                          records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">{formatDate(record.date)}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                                  {record.batchId}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-gray-600">{record.ageWeeks}</td>
                              <td className="px-6 py-4 text-center font-medium text-blue-700">{record.weight}</td>
                              <td className="px-6 py-4 text-center text-green-700">{record.uniformity}%</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  record.feathering === 'Excelente' ? 'bg-green-100 text-green-800' :
                                  record.feathering === 'Bom' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {record.feathering}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onEditRecord(record); }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleRequestDelete(record.id); }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                              Nenhum histórico encontrado para este aviário.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};