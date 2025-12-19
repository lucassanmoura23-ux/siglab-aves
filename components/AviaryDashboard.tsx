
import React, { useMemo, useState } from 'react';
import { 
  Filter, 
  Download, 
  ChevronDown, 
  Calendar, 
  Bird, 
  Egg, 
  Scale, 
  Weight, 
  Activity,
  Search
} from 'lucide-react';
import { ProductionRecord, BatchRecord } from '../types';

interface AviaryDashboardProps {
  records: ProductionRecord[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const AviaryDashboard: React.FC<AviaryDashboardProps> = ({ records }) => {
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [monthFilter, setMonthFilter] = useState('-- Por Mês --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos Aviários');
  const [batchFilter, setBatchFilter] = useState('-- Todos Lotes --');

  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const aviaryColors: Record<string, { 
    border: string, text: string, bg: string, stroke: string,
    gradientFrom: string, gradientTo: string 
  }> = {
    '1': { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500', stroke: '#3b82f6', gradientFrom: 'from-blue-600', gradientTo: 'to-blue-400' },
    '2': { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500', stroke: '#10b981', gradientFrom: 'from-emerald-600', gradientTo: 'to-emerald-400' },
    '3': { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-500', stroke: '#f97316', gradientFrom: 'from-orange-600', gradientTo: 'to-orange-400' },
    '4': { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-500', stroke: '#a855f7', gradientFrom: 'from-purple-600', gradientTo: 'to-purple-400' },
  };

  // Opções dinâmicas para os filtros
  const yearOptions = useMemo(() => {
    const years = (Array.from(new Set(records.map(r => r.date.split('-')[0]))) as string[]).sort((a, b) => b.localeCompare(a));
    return ['-- Por Ano --', ...years];
  }, [records]);

  const batchOptions = useMemo(() => {
    const batches = (Array.from(new Set(records.map(r => r.batchId))).filter(id => id && id !== '-') as string[]).sort((a, b) => a.localeCompare(b));
    return ['-- Todos Lotes --', ...batches];
  }, [records]);

  const fortnightOptions = useMemo(() => {
    const uniquePeriods = new Set<string>();
    records.forEach(r => { 
      if (!r.date || !r.date.includes('-')) return;
      const [y, m] = r.date.split('-'); 
      uniquePeriods.add(`${y}-${parseInt(m) - 1}`); 
    });
    
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

      if (aviaryFilter !== 'Todos Aviários' && record.aviaryId !== aviaryFilter.replace(/\D/g, '')) return false;
      if (batchFilter !== '-- Todos Lotes --' && record.batchId !== batchFilter) return false;
      if (yearFilter !== '-- Por Ano --' && rYearStr !== yearFilter) return false;
      if (monthFilter !== '-- Por Mês --' && rMonth !== MONTHS.indexOf(monthFilter) + 1) return false;
      
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
        if (periodFilter === 'Mês Atual') { 
          if (rMonth !== (today.getMonth() + 1) || parseInt(rYearStr) !== today.getFullYear()) return false; 
        }
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, periodFilter, yearFilter, monthFilter, fortnightFilter, aviaryFilter, batchFilter]);

  const stats = useMemo(() => {
    const ids = ['1', '2', '3', '4'];
    return ids.map(id => {
      const avRecs = filteredRecords.filter(r => r.aviaryId === id).sort((a, b) => a.date.localeCompare(b.date));
      if (avRecs.length === 0) return { id, totalEggs: 0, liveBirds: 0, layingRate: 0, quality: { limpos: 0, sujos: 0, trincados: 0, cama: 0 }, avgEggWeight: 0, avgBirdWeight: 0, mortality: 0 };
      
      const totalEggs = avRecs.reduce((s, r) => s + r.metrics.totalEggs, 0);
      const latestBirds = avRecs[avRecs.length - 1].liveBirds;
      const totalMortality = avRecs.reduce((s, r) => s + r.mortality, 0);
      
      // Média ponderada pela população
      const totalBirdDays = avRecs.reduce((sum, r) => sum + (r.liveBirds || 0), 0);
      const avgRate = totalBirdDays > 0 ? (totalEggs / totalBirdDays) * 100 : 0;
      
      const quality = {
        limpos: avRecs.reduce((s, r) => s + r.cleanEggs, 0),
        sujos: avRecs.reduce((s, r) => s + r.dirtyEggs, 0),
        trincados: avRecs.reduce((s, r) => s + r.crackedEggs, 0),
        cama: avRecs.reduce((s, r) => s + r.floorEggs, 0)
      };

      const eggW = avRecs.filter(r => r.eggWeightAvg > 0);
      const avgEggW = eggW.length > 0 ? eggW.reduce((sum, r) => sum + r.eggWeightAvg, 0) / eggW.length : 0;
      
      const birdW = avRecs.filter(r => r.birdWeightAvg > 0);
      const avgBirdW = birdW.length > 0 ? birdW.reduce((sum, r) => sum + r.birdWeightAvg, 0) / birdW.length : 0;

      return { id, totalEggs, liveBirds: latestBirds, layingRate: avgRate, quality, avgEggWeight: avgEggW, avgBirdWeight: avgBirdW, mortality: totalMortality };
    });
  }, [filteredRecords]);

  const chartData = useMemo(() => {
    const dataByMonth: Record<number, Record<string, number>> = {};
    for (let i = 0; i < 12; i++) dataByMonth[i] = { '1': 0, '2': 0, '3': 0, '4': 0, total: 0 };
    
    filteredRecords.forEach(r => {
      const monthIdx = parseInt(r.date.split('-')[1]) - 1;
      if (dataByMonth[monthIdx]) {
        dataByMonth[monthIdx][r.aviaryId] += r.metrics.totalEggs;
        dataByMonth[monthIdx].total += r.metrics.totalEggs;
      }
    });
    return dataByMonth;
  }, [filteredRecords]);

  const renderLineChart = () => {
    const h = 200; const w = 800; const p = 40;
    const isSingleAviary = aviaryFilter !== 'Todos Aviários';
    const activeId = isSingleAviary ? aviaryFilter.replace(/\D/g, '') : null;
    
    let maxVal = 0;
    Object.values(chartData).forEach((m: any) => {
      if (activeId) maxVal = Math.max(maxVal, m[activeId]);
      else maxVal = Math.max(maxVal, m['1'], m['2'], m['3'], m['4']);
    });
    
    if (maxVal === 0) maxVal = 1000;
    const getX = (i: number) => p + (i * (w - p * 2) / 11);
    const getY = (v: number) => h - p - (v / maxVal) * (h - p * 2);

    return (
      <div className="relative w-full h-full group">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {[0, 0.5, 1].map(v => (<line key={v} x1={p} y1={getY(v * maxVal)} x2={w - p} y2={getY(v * maxVal)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />))}
          {['1', '2', '3', '4'].map(id => {
            if (activeId && activeId !== id) return null;
            const points = Object.values(chartData).map((d: any, i: number) => `${getX(i)},${getY(d[id])}`).join(' ');
            const hasData = Object.values(chartData).some((d: any) => d[id] > 0);
            if (!hasData) return null;
            return <polyline key={id} points={points} fill="none" stroke={aviaryColors[id].stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />;
          })}
          {MONTHS_SHORT.map((m, i) => (<text key={m} x={getX(i)} y={h - 10} textAnchor="middle" className="text-[10px] fill-gray-400 font-bold uppercase">{m}</text>))}
          {MONTHS_SHORT.map((_, i) => (<rect key={i} x={getX(i) - 20} y={0} width="40" height={h} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)} />))}
        </svg>

        {hoveredMonthIdx !== null && (
          <div className="absolute bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100 z-50 pointer-events-none min-w-[160px]" style={{ top: '0', left: (getX(hoveredMonthIdx) / w) > 0.7 ? 'auto' : `${(getX(hoveredMonthIdx) / w) * 100}%`, right: (getX(hoveredMonthIdx) / w) > 0.7 ? '5%' : 'auto', transform: 'translateX(10px)' }}>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-50"><Calendar size={12} className="text-blue-500" /><span className="text-[10px] font-black text-gray-700 uppercase">{MONTHS[hoveredMonthIdx]}</span></div>
            <div className="space-y-1">
              {['1', '2', '3', '4'].map(id => {
                if (activeId && activeId !== id) return null;
                const val = (chartData[hoveredMonthIdx] as any)[id];
                return (
                  <div key={id} className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-gray-500">Av. {id}:</span>
                    <span className="text-gray-800">{val.toLocaleString('pt-BR')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const clearFilters = () => {
    setPeriodFilter('Todo o Período');
    setYearFilter('-- Por Ano --');
    setMonthFilter('-- Por Mês --');
    setFortnightFilter('-- Por Quinzena --');
    setAviaryFilter('Todos Aviários');
    setBatchFilter('-- Todos Lotes --');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros Completa */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
          <Filter size={14} /> Filtros de Pesquisa
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias', 'Mês Atual']} />
          <FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <FilterSelect value={monthFilter} onChange={setMonthFilter} options={['-- Por Mês --', ...MONTHS]} />
          <FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} />
          <FilterSelect value={batchFilter} onChange={setBatchFilter} options={batchOptions} />
          <button onClick={clearFilters} className="ml-auto text-[10px] font-black text-blue-600 uppercase hover:underline">Limpar Filtros</button>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-black text-[#1e293b] uppercase tracking-tight">Análise Individual de Aviários</h2>
        <button className="bg-emerald-500 text-white p-2 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
          <Download size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter(av => av.totalEggs > 0 || aviaryFilter.includes(av.id)).map((av: any) => (
          <div key={av.id} className={`bg-white rounded-xl border-t-4 shadow-sm ${aviaryColors[av.id].border} overflow-hidden hover:shadow-md transition-shadow`}>
            <div className="p-4 flex justify-between items-center border-b border-gray-50 bg-gray-50/20">
              <span className="font-black text-gray-900 text-sm">Aviário {av.id}</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Taxa: <span className="text-sm">{av.layingRate.toFixed(1)}%</span></span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-50">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL OVOS</p>
                <p className="text-xl font-black text-gray-800">{av.totalEggs.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">AVES VIVAS</p>
                <p className="text-xl font-black text-blue-900">{av.liveBirds.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">QUALIDADE ACUMULADA</p>
              <QualityItem label="Limpos" value={av.quality.limpos} total={av.totalEggs} color="bg-emerald-500" />
              <QualityItem label="Sujos" value={av.quality.sujos} total={av.totalEggs} color="bg-orange-500" />
              <QualityItem label="Trincados" value={av.quality.trincados} total={av.totalEggs} color="bg-red-500" />
            </div>
            <div className="p-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-50 mt-2">
              <span className="text-[9px] font-black text-gray-400 uppercase">Mortalidade:</span>
              <span className="text-sm font-black text-red-500">{av.mortality}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <div className="w-2 h-4 bg-blue-500 rounded-full"></div> Produção Mensal por Aviário
            </h3>
          </div>
          <div className="h-64 w-full">{renderLineChart()}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
              <div className="w-2 h-4 bg-emerald-500 rounded-full"></div> Comparativo de Postura (%)
            </h3>
          </div>
          <div className="h-64 flex items-end justify-around border-b border-gray-100 pb-2 relative">
            {stats.map((av: any) => (
              <div key={av.id} className="flex flex-col items-center w-full relative group cursor-pointer">
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] p-1.5 rounded font-black whitespace-nowrap z-10">{av.layingRate.toFixed(1)}%</div>
                <div 
                  className={`w-8 md:w-12 rounded-t-lg bg-gradient-to-b ${aviaryColors[av.id].gradientFrom} ${aviaryColors[av.id].gradientTo} shadow-lg shadow-gray-100 animate-grow-v`} 
                  style={{ height: `${Math.max(2, Math.min(100, av.layingRate) * 1.5)}px` }} 
                />
                <span className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-tighter">AV. {av.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const QualityItem = ({ label, value, total, color }: any) => (
  <div className="flex justify-between items-center text-[10px]">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="font-bold text-gray-600">{label}</span>
    </div>
    <div className="text-right">
      <span className="font-black text-gray-800">{value.toLocaleString('pt-BR')}</span>
      <span className="text-gray-400 ml-1 text-[9px]">({total > 0 ? ((value/total)*100).toFixed(1) : '0.0'}%)</span>
    </div>
  </div>
);

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (
  <div className="relative">
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="appearance-none bg-gray-50 border border-gray-100 text-[10px] font-black py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer uppercase tracking-tight"
    >
      {options.map(o => { 
        const custom = customLabels?.find(cl => cl.value === o); 
        return <option key={o} value={o}>{custom ? custom.label : o}</option>; 
      })}
    </select>
    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);
