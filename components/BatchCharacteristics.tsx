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
  Edit,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const handleExportXLSX = () => {
     if (records.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    
    const data = records.map(r => ({
      "Data": r.date,
      "Aviario": r.aviaryId,
      "Lote": r.batchId,
      "Idade (Sem)": r.ageWeeks,
      "Peso (g)": r.weight,
      "Uniformidade": r.uniformity,
      "Empenamento": r.feathering,
      "Tipo Vacina": r.vaccineType || '',
      "Idade Vacinação": r.vaccinationAge || 0,
      "Dose": r.dose || '',
      "Finalizado": r.isFinalized ? 'Sim' : 'Não',
      "Data Finalização": r.finalizationDate || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lotes");
    XLSX.writeFile(wb, `lotes_aviario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (json.length < 2) return;

        const newRecords: BatchRecord[] = [];
        
        const parseDateFlexible = (dateStr: any) => {
          if (!dateStr) return null;
          
          if (typeof dateStr === 'number') {
            const date = XLSX.SSF.parse_date_code(dateStr);
            const y = date.y;
            const m = String(date.m).padStart(2, '0');
            const d = String(date.d).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }

          const str = String(dateStr).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
            const [d, m, y] = str.split('/');
            return `${y}-${m}-${d}`;
          }
          return null;
        };

        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          const date = parseDateFlexible(row[0]);
          if (!date) continue;

          newRecords.push({
            id: crypto.randomUUID(),
            date: date,
            aviaryId: String(row[1] || '1'),
            batchId: String(row[2] || '-'),
            ageWeeks: Number(row[3]) || 0,
            currentBirds: 0, 
            weight: Number(row[4]) || 0,
            uniformity: Number(row[5]) || 0,
            feathering: (row[6] as any) || 'Bom',
            vaccineType: String(row[7] || ''),
            vaccinationAge: Number(row[8]) || 0,
            dose: (row[9] as any) || '1ª Dose',
            isFinalized: row[10] === 'Sim' || row[10] === true,
            finalizationDate: parseDateFlexible(row[11]) || ''
          });
        }
        
        if (newRecords.length > 0) {
          onImportRecords(newRecords);
          alert(`${newRecords.length} lotes importados.`);
        } else {
          alert("Nenhum lote válido encontrado.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao importar arquivo.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <input 
        type="file" 
        accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
            onClick={handleExportXLSX}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Exportar XLSX</span>
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
                          <th className="px-6 py-4 text-center">Vacina</th>
                          <th className="px-6 py-4 text-center">Dose</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {records.length > 0 ? (
                          records.map((record) => (
                            <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${record.isFinalized ? 'bg-amber-50/30' : ''}`}>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {formatDate(record.date)}
                                {record.isFinalized && (
                                  <div className="mt-1">
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded">Finalizado</span>
                                    {record.finalizationDate && (
                                      <span className="ml-1 text-[9px] text-amber-600 font-bold italic">em {formatDate(record.finalizationDate)}</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">
                                  {record.batchId}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-gray-600">{record.ageWeeks}</td>
                              <td className="px-6 py-4 text-center font-medium text-blue-700">{record.weight}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-[11px] font-bold text-gray-700">{record.vaccineType || '-'}</div>
                                <div className="text-[9px] text-gray-400">{record.vaccinationAge ? `${record.vaccinationAge} dias` : ''}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                                  {record.dose || '-'}
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