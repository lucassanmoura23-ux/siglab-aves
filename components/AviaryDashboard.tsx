
import React, { useMemo, useState } from 'react';
import { 
  Filter, 
  ChevronDown, 
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Info
} from 'lucide-react';
import { ProductionRecord } from '../types';

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
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  const aviaryColors: Record<string, { 
    border: string, text: string, bg: string, stroke: string,
    gradient: string
  }> = {
    '1': { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500', stroke: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
    '2': { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500', stroke: '#10b981', gradient: 'from-emerald-400 to-emerald-600' },
    '3': { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-500', stroke: '#f97316', gradient: 'from-orange-400 to-orange-600' },
    '4': { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-500', stroke: '#a855f7', gradient: 'from-purple-400 to-purple-600' },
  };

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
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, periodFilter, yearFilter, monthFilter, fortnightFilter, aviaryFilter, batchFilter]);

  const stats = useMemo(() => {
    const ids = ['1', '2', '3', '4'];
    return ids.map(id => {
      const avRecs = filteredRecords.filter(r => r.aviaryId === id);
      if (avRecs.length === 0) return { id, totalEggs: 0, liveBirds: 0, layingRate: 0, quality: { limpos: 0, sujos: 0, trincados: 0, cama: 0 }, mortality: 0 };
      const totalEggs = avRecs.reduce((s, r) => s + r.metrics.totalEggs, 0);
      const latestBirds = avRecs.length > 0 ? avRecs[avRecs.length - 1].liveBirds : 0;
      const totalBirdDays = avRecs.reduce((sum, r) => sum + (r.liveBirds || 0), 0);
      return { id, totalEggs, liveBirds: latestBirds, layingRate: totalBirdDays > 0 ? (totalEggs / totalBirdDays) * 100 : 0, quality: { limpos: avRecs.reduce((s, r) => s + r.cleanEggs, 0), sujos: avRecs.reduce((s, r) => s + r.dirtyEggs, 0), trincados: avRecs.reduce((s, r) => s + r.crackedEggs, 0), cama: avRecs.reduce((s, r) => s + r.floorEggs, 0) }, mortality: avRecs.reduce((s, r) => s + r.mortality, 0) };
    });
  }, [filteredRecords]);

  const lineChartData = useMemo(() => {
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

  const renderProductionChart = () => {
    const h = 240; const w = 900; const p = 50;
    const isSingleAviary = aviaryFilter !== 'Todos Aviários';
    const activeId = isSingleAviary ? aviaryFilter.replace(/\D/g, '') : null;
    let maxVal = 0;
    Object.values(lineChartData).forEach((m: any) => { 
      if (activeId) maxVal = Math.max(maxVal, m[activeId]); 
      else maxVal = Math.max(maxVal, m['1'], m['2'], m['3'], m['4']); 
    });
    if (maxVal === 0) maxVal = 1000;
    const getX = (i: number) => p + (i * (w - p * 2) / 11);
    const getY = (v: number) => h - p - 10 - (v / maxVal) * (h - p * 2 - 10);

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block overflow-visible" preserveAspectRatio="xMidYMid meet">
        {[0, 0.5, 1].map(v => (
          <g key={v}>
            <line x1={p} y1={getY(v * maxVal)} x2={w - p} y2={getY(v * maxVal)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            <text x={p - 10} y={getY(v * maxVal) + 4} textAnchor="end" className="text-[10px] fill-gray-400 font-bold">{v === 0 ? '0' : (v * maxVal >= 1000 ? `${(v * maxVal / 1000).toFixed(1)}k` : v * maxVal)}</text>
          </g>
        ))}
        {['1', '2', '3', '4'].map(id => {
          if (activeId && activeId !== id) return null;
          const points = Object.values(lineChartData).map((d: any, i: number) => `${getX(i)},${getY(d[id])}`).join(' ');
          const hasData = Object.values(lineChartData).some((d: any) => d[id] > 0);
          if (!hasData) return null;
          return <polyline key={id} points={points} fill="none" stroke={aviaryColors[id].stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />;
        })}
        {MONTHS_SHORT.map((m, i) => (<text key={m} x={getX(i)} y={h - 10} textAnchor="middle" className="text-[11px] fill-gray-400 font-black uppercase tracking-tight">{m}</text>))}
        {MONTHS_SHORT.map((_, i) => (<rect key={i} x={getX(i) - 20} y={0} width="40" height={h} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)} />))}
      </svg>
    );
  };

  const renderLayingRateBarChart = () => {
    const h = 280; const w = 900; const p = 60;
    const chartW = w - p * 2;
    const chartH = h - p * 1.5 - 20;
    
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block overflow-visible" preserveAspectRatio="xMidYMid meet">
        <line x1={p} y1={h - p} x2={w - p} y2={h - p} stroke="#f1f5f9" strokeWidth="1" />
        {stats.map((av, i) => {
          const barWidth = 70;
          const x = p + (i * chartW / 3) - (barWidth / 2);
          const barHeight = Math.max(5, (av.layingRate / 100) * chartH);
          const y = h - p - barHeight;
          const id = av.id;
          
          return (
            <g key={id} onMouseEnter={() => setHoveredBarIdx(i)} onMouseLeave={() => setHoveredBarIdx(null)} className="cursor-pointer">
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="16" className={`fill-current ${aviaryColors[id].text} opacity-80 transition-all hover:opacity-100 animate-grow-v`} style={{ animationDelay: `${i * 100}ms` }} />
              <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" className={`text-[14px] font-black ${aviaryColors[id].text}`} > {av.layingRate.toFixed(1)}% </text>
              <text x={x + barWidth/2} y={h - p + 25} textAnchor="middle" className="text-[12px] font-black fill-gray-500 uppercase tracking-widest">AV.{id}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const clearFilters = () => {
    setPeriodFilter('Todo o Período'); setYearFilter('-- Por Ano --'); setMonthFilter('-- Por Mês --'); setFortnightFilter('-- Por Quinzena --'); setAviaryFilter('Todos Aviários'); setBatchFilter('-- Todos Lotes --');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
          <Filter size={14} /> Filtros de Pesquisa
        </div>
        <div className="flex flex-wrap gap-3">
          <FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias', 'Mês Atual']} />
          <FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <FilterSelect value={monthFilter} onChange={setMonthFilter} options={['-- Por Mês --', ...MONTHS]} />
          <FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} />
          <FilterSelect value={batchFilter} onChange={setBatchFilter} options={batchOptions} />
          <button onClick={clearFilters} className="text-[10px] font-black text-blue-600 uppercase hover:underline ml-auto">Limpar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((av: any) => (
          <div key={av.id} className={`bg-white rounded-xl border-t-4 shadow-sm ${aviaryColors[av.id].border} overflow-hidden`}>
            <div className="p-4 flex justify-between items-center bg-gray-50/20 border-b border-gray-50">
              <span className="font-black text-gray-900 text-sm uppercase tracking-tight">Aviário {av.id}</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Taxa: <span className="text-sm">{av.layingRate.toFixed(1)}%</span></span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-50">
              <div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">OVOS</p><p className="text-xl font-black text-gray-800">{av.totalEggs.toLocaleString('pt-BR')}</p></div>
              <div className="text-right"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">AVES</p><p className="text-xl font-black text-blue-900">{av.liveBirds.toLocaleString('pt-BR')}</p></div>
            </div>
            <div className="p-4 space-y-2">
              <QualityItem label="Limpos" value={av.quality.limpos} total={av.totalEggs} color="bg-emerald-500" />
              <QualityItem label="Sujos" value={av.quality.sujos} total={av.totalEggs} color="bg-orange-500" />
              <QualityItem label="Trincados" value={av.quality.trincados} total={av.totalEggs} color="bg-red-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-7 bg-blue-600 rounded-full"></div>
            <h3 className="text-base font-black text-[#1e293b] uppercase tracking-tight">DESEMPENHO DE PRODUÇÃO MENSAL</h3>
          </div>
          <div className="w-full overflow-visible relative">
               {renderProductionChart()}
               {hoveredMonthIdx !== null && (
                 <div className="absolute bg-white/95 backdrop-blur-md p-2 rounded-lg shadow-xl border border-gray-100 z-50 pointer-events-none min-w-[140px]" style={{ top: '0px', left: `${Math.min(80, Math.max(10, (hoveredMonthIdx / 11) * 90))}%` }}>
                   <div className="text-[9px] font-black text-gray-700 uppercase border-b pb-1 mb-1 tracking-widest">{MONTHS[hoveredMonthIdx]}</div>
                   <div className="space-y-0.5">{['1', '2', '3', '4'].map(id => { 
                     const val = lineChartData[hoveredMonthIdx][id]; 
                     if (val === 0) return null; 
                     return <div key={id} className="flex justify-between items-center text-[10px] font-black"><span className={aviaryColors[id].text}>Av. {id}:</span><span className="text-gray-800">{val.toLocaleString('pt-BR')}</span></div>; 
                   })}</div>
                 </div>
               )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2.5 h-7 bg-emerald-600 rounded-full"></div>
            <h3 className="text-base font-black text-[#1e293b] uppercase tracking-tight">TAXA DE POSTURA MÉDIA (%)</h3>
          </div>
          <div className="w-full overflow-visible relative">
               {renderLayingRateBarChart()}
          </div>
        </div>
      </div>
    </div>
  );
};

const QualityItem = ({ label, value, total, color }: any) => (
  <div className="flex justify-between items-center text-[10px]"><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${color}`} /><span className="font-bold text-gray-500">{label}</span></div><div className="text-right"><span className="font-black text-gray-800">{value.toLocaleString('pt-BR')}</span><span className="text-[8px] text-gray-400 ml-1">({total > 0 ? ((value/total)*100).toFixed(1) : '0.0'}%)</span></div></div>
);

const FilterSelect = ({ value, onChange, options, customLabels }: any) => (
  <div className="relative flex-1 min-w-[130px] md:flex-none">
    <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none w-full bg-gray-50 border border-gray-100 text-[10px] font-black py-2.5 pl-3 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer uppercase tracking-tight transition-all">
      {options.map((o: any) => { const custom = customLabels?.find((cl: any) => cl.value === o); return <option key={o} value={o}>{custom ? custom.label : o}</option>; })}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);
