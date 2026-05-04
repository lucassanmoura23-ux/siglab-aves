
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Calendar,
  Layers,
  Activity,
  Egg,
  Bird,
  FileDown,
  ChevronDown,
  Filter as FilterIcon,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProductionRecord, BatchRecord } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface DailyRecordsProps {
  records: ProductionRecord[];
  batchRecords: BatchRecord[];
  onEditRecord: (record: ProductionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAll: () => void;
  onImportRecords: (records: ProductionRecord[]) => void;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const DailyRecords: React.FC<DailyRecordsProps> = ({ 
  records, 
  onEditRecord, 
  onDeleteRecord, 
  onDeleteAll,
  onImportRecords
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos os Aviários');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'single' | 'all'>('single');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const yearOptions = useMemo(() => {
    const years = (Array.from(new Set(records.map(r => r.date.split('-')[0]))) as string[])
      .filter(y => y && y.length === 4)
      .sort((a, b) => b.localeCompare(a));
    return ['-- Por Ano --', ...years];
  }, [records]);

  const fortnightOptions = useMemo(() => {
    const uniquePeriods = new Set<string>();
    records.forEach(r => {
      if (!r.date || !r.date.includes('-')) return;
      const [y, m] = r.date.split('-');
      uniquePeriods.add(`${y}-${parseInt(m) - 1}`);
    });

    // Ordenação Cronológica (Mais recente para o mais antigo)
    const sorted = Array.from(uniquePeriods).sort((a, b) => {
      const [yA, mA] = a.split('-').map(Number);
      const [yB, mB] = b.split('-').map(Number);
      return (yB * 12 + mB) - (yA * 12 + mA);
    });

    const options: { label: string, value: string }[] = [];
    sorted.forEach(p => {
      const [year, monthIdx] = p.split('-');
      const mIdx = parseInt(monthIdx);
      options.push({ label: `${MONTHS_SHORT[mIdx]}/${year} - 2ª Quinzena`, value: `${year}-${mIdx}-2` });
      options.push({ label: `${MONTHS_SHORT[mIdx]}/${year} - 1ª Quinzena`, value: `${year}-${mIdx}-1` });
    });

    return options;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (!record.date || !record.date.includes('-')) return false;
      const [rYearStr, rMonthStr, rDayStr] = record.date.split('-');
      const rMonth = parseInt(rMonthStr);
      const rDay = parseInt(rDayStr);
      const recordDate = new Date(record.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const matchTerm = record.date.includes(searchTerm) || 
                        (record.batchId || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchTerm) return false;

      if (aviaryFilter !== 'Todos os Aviários' && record.aviaryId !== aviaryFilter.replace(/\D/g, '')) return false;
      if (yearFilter !== '-- Por Ano --' && rYearStr !== yearFilter) return false;

      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonthIdx, fPart] = fortnightFilter.split('-');
        if (rYearStr !== fYear || (rMonth - 1) !== parseInt(fMonthIdx)) return false;
        if (fPart === '1' && rDay > 15) return false;
        if (fPart === '2' && rDay <= 15) return false;
      }

      if (periodFilter !== 'Todo o Período') {
        const diffDays = Math.ceil(Math.abs(today.getTime() - recordDate.getTime()) / (1000 * 3600 * 24)); 
        if (periodFilter === 'Últimos 7 dias' && diffDays > 7) return false;
        if (periodFilter === 'Últimos 30 dias' && diffDays > 30) return false;
      }

      return true;
    }).sort((a, b) => {
      return new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime();
    });
  }, [records, searchTerm, periodFilter, yearFilter, fortnightFilter, aviaryFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString || !dateString.includes('-')) return 'Data Inválida';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPeriodFilter('Todo o Período');
    setYearFilter('-- Por Ano --');
    setFortnightFilter('-- Por Quinzena --');
    setAviaryFilter('Todos os Aviários');
  };

  const handleExportXLSX = () => {
    if (filteredRecords.length === 0) { alert("Não há dados."); return; }
    
    const data = filteredRecords.map(r => ({
      "Data": r.date,
      "Aviario": r.aviaryId,
      "Lote": r.batchId || '-',
      "Aves Vivas": r.liveBirds,
      "Ovos Limpos": r.cleanEggs,
      "Ovos Sujos": r.dirtyEggs,
      "Ovos Trincados": r.crackedEggs,
      "Ovos Cama": r.floorEggs,
      "Peso Ovos": r.eggWeightAvg,
      "Peso Aves": r.birdWeightAvg,
      "Mortalidade": r.mortality,
      "Observacoes": r.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produção");
    XLSX.writeFile(wb, `producao_siglab_${new Date().toISOString().split('T')[0]}.xlsx`);
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

        const newRecords: ProductionRecord[] = [];
        
        const parseDateFlexible = (dateStr: any) => {
          if (!dateStr) return null;
          
          // Handle Excel date numbers
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

        // Try to find headers or assume standard order
        // Headers: Data, Aviario, Lote, Aves Vivas, Ovos Limpos, Ovos Sujos, Ovos Trincados, Ovos Cama, Peso Ovos, Peso Aves, Mortalidade, Observacoes
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          let date = parseDateFlexible(row[0]);
          if (!date) continue;

          const aviaryId = String(row[1] || '1').replace(/\D/g, '');
          const batchId = String(row[2] || '-');
          const birds = Number(row[3]) || 0;
          const clean = Number(row[4]) || 0;
          const dirty = Number(row[5]) || 0;
          const cracked = Number(row[6]) || 0;
          const floor = Number(row[7]) || 0;
          const total = clean + dirty + cracked + floor;

          newRecords.push({
            id: crypto.randomUUID(),
            date: date,
            aviaryId: aviaryId,
            batchId: batchId,
            liveBirds: birds,
            cleanEggs: clean,
            dirtyEggs: dirty,
            crackedEggs: cracked,
            floorEggs: floor,
            eggWeightAvg: Number(row[8]) || 0,
            birdWeightAvg: Number(row[9]) || 0,
            mortality: Number(row[10]) || 0,
            notes: String(row[11] || ''),
            createdAt: new Date().toISOString(),
            metrics: {
              totalEggs: total,
              cleanPercentage: total > 0 ? (clean / total) * 100 : 0,
              dirtyPercentage: total > 0 ? (dirty / total) * 100 : 0,
              crackedPercentage: total > 0 ? (cracked / total) * 100 : 0,
              floorPercentage: total > 0 ? (floor / total) * 100 : 0,
              layingRate: birds > 0 ? Number(((total / birds) * 100).toFixed(1)) : 0
            }
          });
        }

        if (newRecords.length > 0) {
          onImportRecords(newRecords);
          alert(`${newRecords.length} registros importados.`);
        } else {
          alert("Nenhum registro válido encontrado no arquivo.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao processar o arquivo. Verifique se o formato está correto.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <input type="file" accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={() => modalType === 'single' ? (selectedRecordId && onDeleteRecord(selectedRecordId)) : onDeleteAll()} message={modalType === 'all' ? "Deseja apagar todos os registros permanentemente?" : "Deseja apagar este registro?"} />
      
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest"><FilterIcon size={14} /> Filtros:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias']} />
          <FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos os Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} />
        </div>
        <div className="flex justify-end"><button onClick={clearFilters} className="text-[10px] font-black text-blue-600 uppercase hover:underline tracking-widest">Limpar Filtros</button></div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <input type="text" placeholder="Buscar data ou lote..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
          <Search size={18} className="absolute left-3 top-3.5 text-gray-300" />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
            <Upload size={14} /> Importar
          </button>
          <button onClick={handleExportXLSX} className="px-4 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
            <FileSpreadsheet size={14} /> Exportar XLSX
          </button>
          <button onClick={() => { setModalType('all'); setIsModalOpen(true); }} className="col-span-2 sm:w-auto px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2">
            <Trash2 size={14} /> Apagar Tudo
          </button>
        </div>
      </div>

      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-5">Data</th>
              <th className="px-4 py-5">Aviário</th>
              <th className="px-4 py-5">Lote</th>
              <th className="px-4 py-5 text-center">Total Ovos</th>
              <th className="px-4 py-5 text-center">Taxa %</th>
              <th className="px-4 py-5 text-center">% Limp</th>
              <th className="px-4 py-5 text-center">% Sujo</th>
              <th className="px-4 py-5 text-center">% Trin</th>
              <th className="px-4 py-5 text-center">Cama</th>
              <th className="px-4 py-5 text-center">Mort.</th>
              <th className="px-4 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRecords.length > 0 ? filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-[11px] font-bold text-gray-500 whitespace-nowrap">{formatDate(record.date)}</td>
                <td className="px-4 py-4 text-[11px] font-bold text-gray-900 whitespace-nowrap">Aviário {record.aviaryId}</td>
                <td className="px-4 py-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-tighter">{record.batchId}</span></td>
                <td className="px-4 py-4 text-center text-xs font-black text-gray-800">{record.metrics.totalEggs.toLocaleString()}</td>
                <td className="px-4 py-4 text-center"><span className={`text-[11px] font-black ${record.metrics.layingRate > 90 ? 'text-emerald-600' : 'text-red-500'}`}>{record.metrics.layingRate}%</span></td>
                <td className="px-4 py-4 text-center text-[11px] font-bold text-emerald-600">{record.metrics.cleanPercentage.toFixed(1)}%</td>
                <td className="px-4 py-4 text-center text-[11px] font-bold text-orange-500">{record.metrics.dirtyPercentage.toFixed(1)}%</td>
                <td className="px-4 py-4 text-center text-[11px] font-bold text-red-500">{record.metrics.crackedPercentage.toFixed(1)}%</td>
                <td className="px-4 py-4 text-center text-[11px] font-bold text-purple-600">{record.floorEggs || 0}</td>
                <td className="px-4 py-4 text-center text-[11px] font-black text-gray-900">{record.mortality}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEditRecord(record)} className="text-blue-400 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16}/></button>
                    <button onClick={() => { setSelectedRecordId(record.id); setModalType('single'); setIsModalOpen(true); }} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={11} className="px-6 py-20 text-center text-gray-400 uppercase font-black text-[10px] tracking-widest">Sem registros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-4">
        {filteredRecords.length > 0 ? filteredRecords.map(record => (
          <div key={record.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{formatDate(record.date)}</div>
                <div className="text-sm font-black text-gray-900">Aviário {record.aviaryId}</div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded w-fit">Lote: {record.batchId}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEditRecord(record)} className="p-2 text-blue-500 bg-blue-50 rounded-lg"><Edit size={16}/></button>
                <button onClick={() => { setSelectedRecordId(record.id); setModalType('single'); setIsModalOpen(true); }} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
              <div><div className="text-[8px] font-black text-gray-400 uppercase">Total Ovos</div><div className="text-sm font-black text-gray-800">{record.metrics.totalEggs.toLocaleString()}</div></div>
              <div><div className="text-[8px] font-black text-gray-400 uppercase">Taxa Postura</div><div className={`text-sm font-black ${record.metrics.layingRate > 90 ? 'text-emerald-600' : 'text-red-500'}`}>{record.metrics.layingRate}%</div></div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold bg-gray-50 p-2 rounded-xl">
              <div><span className="block text-emerald-600">LIMP</span>{record.metrics.cleanPercentage.toFixed(0)}%</div>
              <div><span className="block text-orange-600">SUJO</span>{record.metrics.dirtyPercentage.toFixed(0)}%</div>
              <div><span className="block text-red-600">TRIN</span>{record.metrics.crackedPercentage.toFixed(0)}%</div>
              <div><span className="block text-purple-600">MORT</span>{record.mortality}</div>
            </div>
          </div>
        )) : (
          <div className="px-6 py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 uppercase font-black text-[10px]">Nenhum registro encontrado</div>
        )}
      </div>
    </div>
  );
};

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (
  <div className="relative w-full">
    <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none w-full bg-white border border-gray-200 text-[10px] font-black py-3 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm text-gray-600 uppercase">
      {options.map(o => { const custom = customLabels?.find(cl => cl.value === o); return <option key={o} value={o}>{custom ? custom.label : o}</option>; })}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);
