
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  ChevronDown
} from 'lucide-react';
import { ProductionRecord, ProductionMetrics, BatchRecord } from '../types';
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
  batchRecords,
  onEditRecord, 
  onDeleteRecord, 
  onDeleteAll,
  onImportRecords
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [filterAviary, setFilterAviary] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'single' | 'all'>('single');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Geração de Quinzenas baseada no histórico
  const fortnightOptions = useMemo(() => {
    const options: { label: string, value: string }[] = [];
    const uniquePeriods = new Set<string>();

    records.forEach(r => {
      if (!r.date) return;
      const [y, m] = r.date.split('-');
      uniquePeriods.add(`${y}-${parseInt(m) - 1}`);
    });

    const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => b.localeCompare(a));

    sortedPeriods.forEach(period => {
      const [year, monthIdx] = period.split('-').map(Number);
      options.push({ label: `${MONTHS_SHORT[monthIdx]}/${year} - 2ª Quinzena`, value: `${year}-${monthIdx}-2` });
      options.push({ label: `${MONTHS_SHORT[monthIdx]}/${year} - 1ª Quinzena`, value: `${year}-${monthIdx}-1` });
    });

    return options;
  }, [records]);

  const yearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(records.map(r => parseInt(r.date.split('-')[0], 10))))
      .sort((a, b) => (b as number) - (a as number));
    return uniqueYears.length === 0 ? [new Date().getFullYear()] : uniqueYears;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const batchTerm = (record.batchId || '').toLowerCase();
      if (!(batchTerm.includes(searchTerm.toLowerCase()) || record.date.includes(searchTerm))) return false;
      if (filterAviary && record.aviaryId !== filterAviary) return false;

      if (periodFilter !== 'Todo o Período') {
        const diffDays = Math.ceil(Math.abs(Number(today.getTime()) - Number(recordDate.getTime())) / (1000 * 3600 * 24)); 
        if (periodFilter === 'Últimos 7 dias' && diffDays > 7) return false;
        if (periodFilter === 'Últimos 30 dias' && diffDays > 30) return false;
        if (periodFilter === 'Mês Atual') {
           const [rYear, rMonth] = record.date.split('-').map(Number);
           if (rMonth !== (today.getMonth() + 1) || rYear !== today.getFullYear()) return false;
        }
      }

      if (yearFilter !== '-- Por Ano --') {
        if (parseInt(record.date.split('-')[0], 10) !== parseInt(yearFilter, 10)) return false;
      }

      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonthIdx, fPart] = fortnightFilter.split('-').map(Number);
        const [rYear, rMonth, rDay] = record.date.split('-').map(Number);
        if (rYear !== fYear || (rMonth - 1) !== fMonthIdx) return false;
        if (fPart === 1 && rDay > 15) return false;
        if (fPart === 2 && rDay <= 15) return false;
      }

      return true;
    }).sort((a, b) => Number(new Date(b.date).getTime()) - Number(new Date(a.date).getTime()));
  }, [records, searchTerm, filterAviary, periodFilter, yearFilter, fortnightFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleConfirmDelete = () => {
    if (modalType === 'single' && selectedRecordId) onDeleteRecord(selectedRecordId);
    else if (modalType === 'all') onDeleteAll();
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) { alert("Não há dados."); return; }
    const headers = ["Data", "Aviario", "Lote", "Aves Vivas", "Ovos Limpos", "Ovos Sujos", "Ovos Trincados", "Ovos Cama", "Peso Ovos", "Peso Aves", "Mortalidade", "Observacoes"];
    const csvRows = [headers.join(';'), ...filteredRecords.map(r => [r.date, r.aviaryId, r.batchId || '-', r.liveBirds, r.cleanEggs, r.dirtyEggs, r.crackedEggs, r.floorEggs, r.eggWeightAvg, r.birdWeightAvg, r.mortality, `"${r.notes || ''}"`].join(';'))];
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement("a"); link.setAttribute("href", csvContent); link.setAttribute("download", `producao_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const calculateMetrics = (clean: number, dirty: number, cracked: number, floor: number, birds: number): ProductionMetrics => {
    const total = clean + dirty + cracked + floor;
    const perc = (v: number) => total > 0 ? Number(((v / total) * 100).toFixed(1)) : 0;
    return {
      totalEggs: total,
      cleanPercentage: perc(clean),
      dirtyPercentage: perc(dirty),
      crackedPercentage: perc(cracked),
      floorPercentage: perc(floor),
      layingRate: birds > 0 ? Number(((total / birds) * 100).toFixed(1)) : 0
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string; if (!text) return;
      try {
        const lines = text.split('\n'); const newRecords: ProductionRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim(); if (!line) continue;
          const separator = line.includes(';') ? ';' : ',';
          const cols = line.split(separator).map(c => c.replace(/"/g, '').trim());
          if (cols.length < 5) continue;
          const date = cols[0]; let aviaryId = cols[1].replace(/\D/g, '');
          const activeBatch = batchRecords.filter(b => b.aviaryId === aviaryId && b.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0]; 
          const clean = Number(cols[4]) || 0; const dirty = Number(cols[5]) || 0; const cracked = Number(cols[6]) || 0; const floor = Number(cols[7]) || 0; const birds = Number(cols[3]) || 0;
          newRecords.push({
            id: crypto.randomUUID(), createdAt: new Date().toISOString(), date, aviaryId, batchId: activeBatch ? activeBatch.batchId : '-',
            liveBirds: birds, cleanEggs: clean, dirtyEggs: dirty, crackedEggs: cracked, floorEggs: floor, eggWeightAvg: Number(cols[8]) || 0, birdWeightAvg: Number(cols[9]) || 0, mortality: Number(cols[10]) || 0, notes: cols[11] || '',
            metrics: calculateMetrics(clean, dirty, cracked, floor, birds)
          });
        }
        if (newRecords.length > 0) onImportRecords(newRecords);
      } catch (err) { alert("Erro CSV"); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmDelete} title={modalType === 'all' ? "Apagar Tudo" : "Confirmação"} message={modalType === 'all' ? "Apagar tudo?" : "Apagar este?"} />

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm font-medium"><Filter size={16} /><span>Filtros:</span></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FilterSelect value={periodFilter} onChange={v => { setPeriodFilter(v); setYearFilter('-- Por Ano --'); setFortnightFilter('-- Por Quinzena --'); }} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias', 'Mês Atual']} />
          <FilterSelect value={yearFilter} onChange={v => { setYearFilter(v); setPeriodFilter('Todo o Período'); }} options={['-- Por Ano --', ...yearOptions.map(String)]} />
          <FilterSelect value={fortnightFilter} onChange={v => { setFortnightFilter(v); setPeriodFilter('Todo o Período'); }} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={filterAviary} onChange={setFilterAviary} options={['Todos os Aviários', '1', '2', '3', '4']} customLabels={[{label:'Todos os Aviários', value:''}, {label:'Aviário 1', value:'1'}, {label:'Aviário 2', value:'2'}, {label:'Aviário 3', value:'3'}, {label:'Aviário 4', value:'4'}]} />
        </div>
        <div className="flex justify-end mt-2"><button onClick={() => {setSearchTerm(''); setFilterAviary(''); setPeriodFilter('Todo o Período'); setYearFilter('-- Por Ano --'); setFortnightFilter('-- Por Quinzena --');}} className="text-xs text-blue-600 font-medium">Limpar Filtros</button></div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Importar</button>
          <button onClick={handleExportCSV} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Exportar</button>
          <button onClick={() => { setModalType('all'); setIsModalOpen(true); }} className="flex-1 bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">Apagar Tudo</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Data</th><th className="px-6 py-4">Aviário</th><th className="px-6 py-4">Lote</th><th className="px-6 py-4 text-center">Total Ovos</th><th className="px-6 py-4 text-center">Taxa Postura</th><th className="px-6 py-4 text-center">% Limp</th><th className="px-6 py-4 text-center">% Sujo</th><th className="px-6 py-4 text-center">% Trin</th><th className="px-6 py-4 text-center">Cama</th><th className="px-6 py-4 text-center">Mort.</th><th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length > 0 ? filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 text-gray-600">Aviário {record.aviaryId}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${record.batchId === '-' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>{record.batchId}</span></td>
                  <td className="px-6 py-4 text-center font-medium">{record.metrics.totalEggs.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${record.metrics.layingRate > 90 ? 'bg-green-100 text-green-700' : record.metrics.layingRate > 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{record.metrics.layingRate}%</span></td>
                  <td className="px-6 py-4 text-center text-green-600">{record.metrics.cleanPercentage}%</td>
                  <td className="px-6 py-4 text-center text-orange-600">{record.metrics.dirtyPercentage}%</td>
                  <td className="px-6 py-4 text-center text-red-600">{record.metrics.crackedPercentage}%</td>
                  <td className="px-6 py-4 text-center text-yellow-600">{record.metrics.floorPercentage > 0 ? `${record.metrics.floorPercentage}%` : '-'}</td>
                  <td className="px-6 py-4 text-center text-gray-500">{record.mortality}</td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => onEditRecord(record)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit size={20} /></button><button onClick={() => { setSelectedRecordId(record.id); setModalType('single'); setIsModalOpen(true); }} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={20} /></button></div></td>
                </tr>
              )) : <tr><td colSpan={11} className="px-6 py-20 text-center text-gray-400">Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => { const c = customLabels?.find(l => l.value === o); return <option key={o} value={o}>{c ? c.label : o}</option>; })}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
  </div>
);
