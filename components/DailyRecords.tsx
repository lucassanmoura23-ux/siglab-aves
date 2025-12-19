
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
  Filter as FilterIcon
} from 'lucide-react';
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

  // Opções dinâmicas para os filtros
  const yearOptions = useMemo(() => {
    const years = (Array.from(new Set(records.map(r => r.date.split('-')[0]))) as string[])
      .sort((a, b) => b.localeCompare(a));
    return ['-- Por Ano --', ...years];
  }, [records]);

  const fortnightOptions = useMemo(() => {
    const options: { label: string, value: string }[] = [];
    const uniquePeriods = new Set<string>();

    records.forEach(r => {
      const [y, m] = r.date.split('-');
      uniquePeriods.add(`${y}-${parseInt(m) - 1}`);
    });

    const sorted = Array.from(uniquePeriods).sort((a, b) => b.localeCompare(a));

    sorted.forEach(p => {
      const [year, monthIdx] = p.split('-');
      const mIdx = parseInt(monthIdx);
      options.push({ label: `${MONTHS_SHORT[mIdx]}/${year} - 1ª Quinzena`, value: `${year}-${mIdx}-1` });
      options.push({ label: `${MONTHS_SHORT[mIdx]}/${year} - 2ª Quinzena`, value: `${year}-${mIdx}-2` });
    });

    return options;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const [rYearStr, rMonthStr, rDayStr] = record.date.split('-');
      const rMonth = parseInt(rMonthStr);
      const rDay = parseInt(rDayStr);
      const recordDate = new Date(record.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filtro de Busca
      const matchTerm = record.date.includes(searchTerm) || 
                        (record.batchId || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchTerm) return false;

      // Filtro de Aviário
      if (aviaryFilter !== 'Todos os Aviários' && record.aviaryId !== aviaryFilter.replace(/\D/g, '')) return false;
      
      // Filtro de Ano
      if (yearFilter !== '-- Por Ano --' && rYearStr !== yearFilter) return false;

      // Filtro de Quinzena
      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonthIdx, fPart] = fortnightFilter.split('-');
        if (rYearStr !== fYear || (rMonth - 1) !== parseInt(fMonthIdx)) return false;
        if (fPart === '1' && rDay > 15) return false;
        if (fPart === '2' && rDay <= 15) return false;
      }

      // Filtro de Período (Últimos dias)
      if (periodFilter !== 'Todo o Período') {
        const diffDays = Math.ceil(Math.abs(today.getTime() - recordDate.getTime()) / (1000 * 3600 * 24)); 
        if (periodFilter === 'Últimos 7 dias' && diffDays > 7) return false;
        if (periodFilter === 'Últimos 30 dias' && diffDays > 30) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, searchTerm, periodFilter, yearFilter, fortnightFilter, aviaryFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
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

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) { alert("Não há dados."); return; }
    const headers = ["Data", "Aviario", "Lote", "Aves Vivas", "Ovos Limpos", "Ovos Sujos", "Ovos Trincados", "Ovos Cama", "Peso Ovos", "Peso Aves", "Mortalidade", "Observacoes"];
    const csvRows = [headers.join(';'), ...filteredRecords.map(r => [r.date, r.aviaryId, r.batchId || '-', r.liveBirds, r.cleanEggs, r.dirtyEggs, r.crackedEggs, r.floorEggs, r.eggWeightAvg, r.birdWeightAvg, r.mortality, `"${r.notes || ''}"`].join(';'))];
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement("a"); link.setAttribute("href", csvContent); link.setAttribute("download", `producao_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
        const newRecords: ProductionRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const separator = line.includes(';') ? ';' : ',';
          const cols = line.split(separator).map(c => c.replace(/"/g, '').trim());
          if (cols.length < 11) continue;
          const birds = Number(cols[3]) || 0;
          const clean = Number(cols[4]) || 0;
          const dirty = Number(cols[5]) || 0;
          const cracked = Number(cols[6]) || 0;
          const floor = Number(cols[7]) || 0;
          const total = clean + dirty + cracked + floor;
          const rate = birds > 0 ? (total / birds) * 100 : 0;
          newRecords.push({
            id: crypto.randomUUID(), date: cols[0], aviaryId: cols[1], batchId: cols[2], liveBirds: birds, cleanEggs: clean, dirtyEggs: dirty, crackedEggs: cracked, floorEggs: floor, eggWeightAvg: Number(cols[8]) || 0, birdWeightAvg: Number(cols[9]) || 0, mortality: Number(cols[10]) || 0, notes: cols[11] || '', createdAt: new Date().toISOString(),
            metrics: {
                totalEggs: total, cleanPercentage: total > 0 ? (clean / total) * 100 : 0, dirtyPercentage: total > 0 ? (dirty / total) * 100 : 0, crackedPercentage: total > 0 ? (cracked / total) * 100 : 0, floorPercentage: total > 0 ? (floor / total) * 100 : 0, layingRate: Number(rate.toFixed(1))
            }
          });
        }
        if (newRecords.length > 0) onImportRecords(newRecords);
      } catch (err) { alert("Erro ao ler o arquivo CSV."); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={() => modalType === 'single' ? (selectedRecordId && onDeleteRecord(selectedRecordId)) : onDeleteAll()} message={modalType === 'all' ? "Deseja apagar todos os registros permanentemente?" : "Deseja apagar este registro?"} />
      
      {/* Filtros conforme Imagem */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
           <FilterIcon size={14} /> Filtros:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias']} />
          <FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos os Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} />
        </div>
        <div className="flex justify-end">
          <button onClick={clearFilters} className="text-[10px] font-black text-blue-600 uppercase hover:underline tracking-widest">Limpar Filtros</button>
        </div>
      </div>

      {/* Barra de Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
          <Search size={18} className="absolute left-3 top-3.5 text-gray-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50">Importar</button>
          <button onClick={handleExportCSV} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-50">Exportar</button>
          <button onClick={() => { setModalType('all'); setIsModalOpen(true); }} className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all">Apagar Tudo</button>
        </div>
      </div>

      {/* Tabela conforme Imagem */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-5">Data</th>
              <th className="px-6 py-5">Aviário</th>
              <th className="px-6 py-5">Lote</th>
              <th className="px-6 py-5 text-center">Total Ovos</th>
              <th className="px-6 py-5 text-center">Taxa Postura</th>
              <th className="px-6 py-5 text-center">% Limp</th>
              <th className="px-6 py-5 text-center">% Sujo</th>
              <th className="px-6 py-5 text-center">% Trin</th>
              <th className="px-6 py-5 text-center">Cama</th>
              <th className="px-6 py-5 text-center">Mort.</th>
              <th className="px-6 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRecords.length > 0 ? filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-[11px] font-bold text-gray-500">{formatDate(record.date)}</td>
                <td className="px-6 py-4 text-[11px] font-bold text-gray-900">Aviário {record.aviaryId}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-tighter">
                    {record.batchId}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-xs font-black text-gray-800">{record.metrics.totalEggs.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-[11px] font-black ${record.metrics.layingRate > 90 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {record.metrics.layingRate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-[11px] font-bold text-emerald-600">{record.metrics.cleanPercentage.toFixed(1)}%</td>
                <td className="px-6 py-4 text-center text-[11px] font-bold text-orange-500">{record.metrics.dirtyPercentage.toFixed(1)}%</td>
                <td className="px-6 py-4 text-center text-[11px] font-bold text-red-500">{record.metrics.crackedPercentage.toFixed(1)}%</td>
                <td className="px-6 py-4 text-center text-[11px] font-bold text-purple-600">{record.floorEggs || 0}</td>
                <td className="px-6 py-4 text-center text-[11px] font-black text-gray-900">{record.mortality}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEditRecord(record)} className="text-blue-400 p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16}/></button>
                    <button onClick={() => { setSelectedRecordId(record.id); setModalType('single'); setIsModalOpen(true); }} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={11} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <FileDown size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (
  <div className="relative">
    <select 
      value={value} onChange={e => onChange(e.target.value)}
      className="appearance-none w-full bg-white border border-gray-200 text-xs font-medium py-3 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm text-gray-600"
    >
      {options.map(o => {
        const custom = customLabels?.find(cl => cl.value === o);
        return <option key={o} value={o}>{custom ? custom.label : o}</option>;
      })}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);
