
import React, { useMemo, useState } from 'react';
import { 
  Filter, 
  ChevronDown, 
  Egg, 
  TrendingUp, 
  AlertTriangle, 
  Scale, 
  Bird, 
  Weight, 
  CheckCircle2,
  Calendar,
  LineChart as LineChartIcon,
  Activity
} from 'lucide-react';
import { ProductionRecord, BatchRecord } from '../types';

interface GeneralDashboardProps {
  records: ProductionRecord[];
  batchRecords: BatchRecord[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const AVIARY_COLORS: Record<string, string> = {
  '1': '#3b82f6',
  '2': '#10b981',
  '3': '#f59e0b',
  '4': '#a855f7'
};

export const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ records, batchRecords }) => {
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [monthFilter, setMonthFilter] = useState('-- Por Mês --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos Aviários');
  const [batchFilter, setBatchFilter] = useState('-- Todos Lotes --');

  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredAge, setHoveredAge] = useState<number | null>(null);

  const yearOptions = useMemo(() => {
    const years = (Array.from(new Set(records.map(r => r.date.split('-')[0]))) as string[]).sort((a, b) => b.localeCompare(a));
    return ['-- Por Ano --', ...years];
  }, [records]);

  const batchOptions = useMemo(() => {
    const batches = (Array.from(new Set(records.map(r => r.batchId))).filter(id => id && id !== '-') as string[]).sort((a, b) => a.localeCompare(b));
    return ['-- Todos Lotes --', ...batches];
  }, [records]);

  const fortnightOptions = useMemo(() => {
    const options: { label: string, value: string }[] = [];
    const uniquePeriods = new Set<string>();
    records.forEach(r => { 
      if (!r.date || !r.date.includes('-')) return;
      const [y, m] = r.date.split('-'); 
      uniquePeriods.add(`${y}-${parseInt(m) - 1}`); 
    });
    const sorted = Array.from(uniquePeriods).sort((a, b) => b.localeCompare(a));
    sorted.forEach(p => {
      const [year, monthIdx] = p.split('-'); const mIdx = parseInt(monthIdx);
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
        if (periodFilter === 'Mês Atual') { if (rMonth !== (today.getMonth() + 1) || parseInt(rYearStr) !== today.getFullYear()) return false; }
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, periodFilter, yearFilter, monthFilter, fortnightFilter, aviaryFilter, batchFilter]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    const totalEggs = filteredRecords.reduce((sum, r) => sum + r.metrics.totalEggs, 0);
    const latestByAviary: Record<string, number> = {};
    filteredRecords.forEach(r => { latestByAviary[r.aviaryId] = r.liveBirds; });
    const currentBirds = Object.values(latestByAviary).reduce((sum, val) => sum + val, 0);
    const totalBirdDays = filteredRecords.reduce((sum, r) => sum + (r.liveBirds || 0), 0);
    const avgLayingRate = totalBirdDays > 0 ? (totalEggs / totalBirdDays) * 100 : 0;
    const totalMortality = filteredRecords.reduce((sum, r) => sum + r.mortality, 0);
    const mortalityRate = (totalMortality + currentBirds) > 0 ? (totalMortality / (totalMortality + currentBirds)) * 100 : 0;
    const eggW = filteredRecords.filter(r => r.eggWeightAvg > 0);
    const avgEggWeight = eggW.length > 0 ? eggW.reduce((sum, r) => sum + r.eggWeightAvg, 0) / eggW.length : 0;
    const birdW = filteredRecords.filter(r => r.birdWeightAvg > 0);
    const avgBirdWeight = birdW.length > 0 ? birdW.reduce((sum, r) => sum + r.birdWeightAvg, 0) / birdW.length : 0;
    return {
      totalEggs, avgLayingRate, currentBirds, totalMortality, mortalityRate, avgEggWeight, avgBirdWeight,
      quality: {
        clean: filteredRecords.reduce((sum, r) => sum + r.cleanEggs, 0),
        dirty: filteredRecords.reduce((sum, r) => sum + r.dirtyEggs, 0),
        cracked: filteredRecords.reduce((sum, r) => sum + r.crackedEggs, 0),
        floor: filteredRecords.reduce((sum, r) => sum + r.floorEggs, 0),
        total: totalEggs
      }
    };
  }, [filteredRecords]);

  const maturityData = useMemo(() => {
    const batchesMap: Record<string, Record<number, { sum: number, count: number }>> = {};
    filteredRecords.forEach(r => {
      const refBatch = batchRecords.find(b => b.batchId === r.batchId && b.aviaryId === r.aviaryId);
      if (!refBatch) return;
      const dateProd = new Date(r.date + 'T00:00:00');
      const dateRef = new Date(refBatch.date + 'T00:00:00');
      const diffWeeks = Math.floor((dateProd.getTime() - dateRef.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const currentAge = refBatch.ageWeeks + diffWeeks;
      if (currentAge < 0 || currentAge > 120) return;
      if (!batchesMap[r.batchId]) batchesMap[r.batchId] = {};
      if (!batchesMap[r.batchId][currentAge]) batchesMap[r.batchId][currentAge] = { sum: 0, count: 0 };
      batchesMap[r.batchId][currentAge].sum += (r.metrics?.layingRate || 0);
      batchesMap[r.batchId][currentAge].count += 1;
    });
    const result: { batchId: string, points: { age: number, rate: number }[] }[] = [];
    Object.entries(batchesMap).forEach(([batchId, ages]) => {
      const points = Object.entries(ages).map(([age, data]) => ({ age: parseInt(age), rate: data.sum / data.count })).sort((a, b) => a.age - b.age);
      if (points.length > 0) result.push({ batchId, points });
    });
    return result;
  }, [filteredRecords, batchRecords]);

  const allMaturityAges = useMemo(() => {
    const ages = new Set<number>();
    maturityData.forEach(b => b.points.forEach(p => ages.add(p.age)));
    return Array.from(ages).sort((a, b) => a - b);
  }, [maturityData]);

  const renderMaturityChart = () => {
    const width = 1000; const height = 350; const paddingLeft = 70; const paddingRight = 30; const paddingTop = 10; const paddingBottom = 70;
    const chartW = width - paddingLeft - paddingRight; const chartH = height - paddingTop - paddingBottom;
    if (maturityData.length === 0) return <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10"><Activity size={48} className="mb-4 opacity-20" /><p className="italic text-sm">Nenhum dado de maturidade cruzado.</p></div>;
    const minAge = 0; let maxAge = 80; allMaturityAges.forEach(age => { if (age > maxAge) maxAge = Math.ceil(age / 10) * 10; });
    const ageRange = maxAge - minAge;
    const getX = (age: number) => paddingLeft + ((age - minAge) / ageRange) * chartW;
    const getY = (rate: number) => height - paddingBottom - (Math.min(100, rate) / 100) * chartH;
    const lineColors = ['#2563eb', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4"><div className="w-2.5 h-6 bg-blue-600 rounded-full"></div><h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-tight">CURVA DE MATURIDADE DO LOTE (POSTURA % X IDADE)</h3></div>
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-6">{maturityData.map((b, i) => (<div key={b.batchId} className="flex items-center gap-2"><div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: lineColors[i % lineColors.length] }}></div><span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Lote: {b.batchId}</span></div>))}</div>
        <div className="flex-1 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].filter(a => a <= maxAge).map(age => (<line key={age} x1={getX(age)} y1={paddingTop} x2={getX(age)} y2={getY(0)} stroke="#f1f5f9" strokeWidth="1" />))}
            {[0, 25, 50, 75, 100].map(v => (<g key={v}><line x1={paddingLeft} y1={getY(v)} x2={width - paddingRight} y2={getY(v)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" /><text x={paddingLeft - 15} y={getY(v) + 4} textAnchor="end" className="text-[11px] fill-gray-400 font-black">{v}%</text></g>))}
            <line x1={paddingLeft} y1={getY(0)} x2={width - paddingRight} y2={getY(0)} stroke="#1f2937" strokeWidth="2" /><line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={getY(0)} stroke="#1f2937" strokeWidth="2" />
            {maturityData.map((batch, idx) => {
              if (batch.points.length < 1) return null;
              if (batch.points.length === 1) return <circle key={batch.batchId} cx={getX(batch.points[0].age)} cy={getY(batch.points[0].rate)} r="5" fill={lineColors[idx % lineColors.length]} />;
              let d = `M ${getX(batch.points[0].age)},${getY(batch.points[0].rate)}`;
              for (let i = 0; i < batch.points.length - 1; i++) { const curr = batch.points[i]; const next = batch.points[i+1]; const cx = (getX(curr.age) + getX(next.age)) / 2; d += ` C ${cx},${getY(curr.rate)} ${cx},${getY(next.rate)} ${getX(next.age)},${getY(next.rate)}`; }
              return <path key={batch.batchId} d={d} fill="none" stroke={lineColors[idx % lineColors.length]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />;
            })}
            {[0, 20, 40, 60, 80, 100, 120].filter(a => a <= maxAge).map(age => (<text key={age} x={getX(age)} y={getY(0) + 25} textAnchor="middle" className="text-[12px] fill-gray-800 font-black">{age}</text>))}
            <text x={width / 2} y={height - 15} textAnchor="middle" className="text-[11px] font-black fill-gray-800 tracking-tight uppercase">Idade (Semanas)</text>
            {allMaturityAges.map((age) => (<rect key={age} x={getX(age) - 15} y={0} width="30" height={height - paddingBottom} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredAge(age)} onMouseLeave={() => setHoveredAge(null)} />))}
          </svg>
          {hoveredAge !== null && (<div className="absolute bg-white border border-gray-200 p-3 rounded-lg shadow-xl z-50 pointer-events-none min-w-[140px]" style={{ top: '20px', left: (getX(hoveredAge) / width) > 0.7 ? 'auto' : `${(getX(hoveredAge) / width) * 100}%`, right: (getX(hoveredAge) / width) > 0.7 ? '5%' : 'auto', transform: 'translateX(10px)' }}><div className="text-[10px] font-black text-gray-400 mb-2 border-b pb-1 uppercase">{hoveredAge} Semanas</div><div className="space-y-1.5">{maturityData.map((batch, idx) => { const p = batch.points.find(pt => pt.age === hoveredAge); if (!p) return null; return (<div key={batch.batchId} className="flex items-center justify-between text-[11px] font-bold"><span style={{ color: lineColors[idx % lineColors.length] }}>Lote {batch.batchId}</span><span className="text-gray-900">{p.rate.toFixed(1)}%</span></div>); })}</div></div>)}
        </div>
      </div>
    );
  };

  const lineChartData = useMemo(() => {
    const dataByMonth: Record<number, Record<string, number>> = {};
    for (let i = 0; i < 12; i++) dataByMonth[i] = { '1': 0, '2': 0, '3': 0, '4': 0, total: 0 };
    filteredRecords.forEach(r => { const monthIdx = parseInt(r.date.split('-')[1]) - 1; if (dataByMonth[monthIdx]) { dataByMonth[monthIdx][r.aviaryId] += r.metrics.totalEggs; dataByMonth[monthIdx].total += r.metrics.totalEggs; } });
    return dataByMonth;
  }, [filteredRecords]);

  const renderLineChart = () => {
    const width = 800; const height = 250; const paddingLeft = 60; const paddingRight = 40; const paddingTop = 30; const paddingBottom = 40;
    const isSingleAviary = aviaryFilter !== 'Todos Aviários'; const activeId = isSingleAviary ? aviaryFilter.replace(/\D/g, '') : 'total';
    const lineColor = isSingleAviary ? AVIARY_COLORS[activeId] : '#2563eb';
    let maxVal = 0; Object.values(lineChartData).forEach((m: Record<string, number>) => { const val = isSingleAviary ? m[activeId] : m['total']; maxVal = Math.max(maxVal, val); });
    if (maxVal === 0) maxVal = 100; const yAxisMax = Math.ceil(maxVal / 1000) * 1000 || 1000;
    const getX = (idx: number) => paddingLeft + (idx * (width - paddingLeft - paddingRight) / 11);
    const getY = (val: number) => height - paddingBottom - (val / yAxisMax) * (height - paddingBottom - paddingTop);
    const points = Object.values(lineChartData).map((m: Record<string, number>, i) => ({ x: getX(i), y: getY(isSingleAviary ? m[activeId] : m['total']) }));
    let d = points.length > 0 ? `M ${points[0].x},${points[0].y}` : '';
    for (let i = 0; i < points.length - 1; i++) { const curr = points[i]; const next = points[i + 1]; const cx = (curr.x + next.x) / 2; d += ` C ${cx},${curr.y} ${cx},${next.y} ${next.x},${next.y}`; }
    return (
      <div className="relative w-full h-full group">
        <div className="flex items-center gap-3 mb-6"><div className="w-2.5 h-6 bg-blue-600 rounded-full"></div><h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-tight">DESEMPENHO DE PRODUÇÃO MENSAL</h3></div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map(p => { const yPos = height - paddingBottom - (p * (height - paddingBottom - paddingTop)); const labelVal = Math.round(p * yAxisMax); return (<g key={p}><line x1={paddingLeft} y1={yPos} x2={width - paddingRight} y2={yPos} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" /><text x={paddingLeft - 10} y={yPos + 3} textAnchor="end" className="text-[9px] fill-gray-400 font-bold">{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(1)}k` : labelVal}</text></g>); })}
          {MONTHS_SHORT.map((m, i) => (<text key={m} x={getX(i)} y={height - 10} textAnchor="middle" className="text-[10px] fill-gray-400 font-bold uppercase">{m}</text>))}
          {d && <path d={d} fill="none" stroke={lineColor} strokeWidth="4" strokeLinecap="round" className="animate-draw" />}
          {MONTHS_SHORT.map((_, i) => (<rect key={i} x={getX(i) - 20} y={0} width="40" height={height} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)} />))}
        </svg>
        {hoveredMonthIdx !== null && (<div className="absolute bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-gray-100 z-50 pointer-events-none min-w-[160px]" style={{ top: '40px', left: (getX(hoveredMonthIdx) / width) > 0.7 ? 'auto' : `${(getX(hoveredMonthIdx) / width) * 100}%`, right: (getX(hoveredMonthIdx) / width) > 0.7 ? '5%' : 'auto', transform: 'translateX(10px)' }}><div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-50"><Calendar size={12} className="text-blue-500" /><span className="text-[10px] font-black text-gray-700 uppercase">{MONTHS[hoveredMonthIdx]}</span></div><div className="flex items-center justify-between text-[10px] font-bold"><span className="text-gray-500">Produção:</span><span className="text-gray-800">{(isSingleAviary ? (lineChartData[hoveredMonthIdx] as Record<string, number>)[activeId] : (lineChartData[hoveredMonthIdx] as Record<string, number>)['total']).toLocaleString('pt-BR')}</span></div></div>)}
      </div>
    );
  };

  const clearFilters = () => { setPeriodFilter('Todo o Período'); setYearFilter('-- Por Ano --'); setMonthFilter('-- Por Mês --'); setFortnightFilter('-- Por Quinzena --'); setAviaryFilter('Todos Aviários'); setBatchFilter('-- Todos Lotes --'); };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"><div className="flex items-center gap-2 mb-4 text-gray-400 text-[10px] font-black uppercase tracking-widest"><Filter size={14} /> Filtros de Pesquisa</div><div className="flex flex-wrap items-center gap-3"><FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias', 'Mês Atual']} /><FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} /><FilterSelect value={monthFilter} onChange={setMonthFilter} options={['-- Por Mês --', ...MONTHS]} /><FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} /><FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} /><FilterSelect value={batchFilter} onChange={setBatchFilter} options={batchOptions} /><button onClick={clearFilters} className="ml-auto text-[10px] font-black text-blue-600 uppercase hover:underline">Limpar Filtros</button></div></div>
      {!stats ? <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 font-medium">Nenhum dado encontrado para os filtros selecionados.</div> : (<div className="space-y-6 animate-in fade-in duration-500"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><KPICard title="Total Ovos" value={stats.totalEggs.toLocaleString('pt-BR')} subtext="(acumulado no período)" icon={<Egg />} color="blue" /><KPICard title="Taxa Média Postura" value={`${stats.avgLayingRate.toFixed(1)}%`} subtext="(produção/população)" icon={<TrendingUp />} color="green" /><KPICard title="Aves Vivas" value={stats.currentBirds.toLocaleString('pt-BR')} subtext="(saldo atual somado)" icon={<Bird />} color="purple" /><KPICard title="Mortalidade" value={`${stats.totalMortality} (${stats.mortalityRate.toFixed(2)}%)`} subtext="Total e Taxa no Período" icon={<AlertTriangle />} color="red" /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-3"><div className="w-2.5 h-6 bg-emerald-600 rounded-full"></div><h3 className="text-[13px] font-black text-[#1e293b] uppercase tracking-tight">QUALIDADE DOS OVOS</h3></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"><div className="relative flex justify-center"><svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90"><circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" /><SegmentedCircle stats={stats} /></svg><div className="absolute inset-0 flex flex-col items-center justify-center text-center"><p className="text-3xl font-black text-gray-800 ladies-none">{((stats.quality.clean / (stats.quality.total || 1)) * 100).toFixed(0)}%</p><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Limpos</p></div></div><div className="grid grid-cols-2 gap-3"><QualityBox label="Limpos" value={stats.quality.clean} total={stats.quality.total} color="emerald" /><QualityBox label="Sujos" value={stats.quality.dirty} total={stats.quality.total} color="orange" /><QualityBox label="Trincados" value={stats.quality.cracked} total={stats.quality.total} color="red" /><QualityBox label="Cama" value={stats.quality.floor} total={stats.quality.total} color="purple" /></div></div></div><div className="space-y-4"><KPICard title="Peso Médio Ovos" value={`${stats.avgEggWeight.toFixed(1)}g`} subtext="" icon={<Scale />} color="teal" /><KPICard title="Peso Médio Aves" value={`${stats.avgBirdWeight.toFixed(1)}g`} subtext="" icon={<Weight />} color="indigo" /><div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-4 text-white"><div className="p-3 bg-white/20 rounded-xl"><CheckCircle2 size={24} /></div><div><p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Status Sanitário</p><p className="text-lg font-black">Lote Saudável</p></div></div></div></div><div className="space-y-6"><div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm w-full"><div className="h-80 w-full">{renderLineChart()}</div></div><div className="bg-white px-8 pt-6 pb-12 rounded-2xl border border-gray-100 shadow-sm w-full"><div className="w-full h-[450px]">{renderMaturityChart()}</div></div></div></div>)}
    </div>
  );
};

const SegmentedCircle = ({ stats }: { stats: any }) => {
  const total = stats.quality.total || 1; const circumference = 251.32; let currentOffset = 0;
  return (<>
    {[{ label: 'Limpos', value: stats.quality.clean, color: '#10b981' }, { label: 'Sujos', value: stats.quality.dirty, color: '#f59e0b' }, { label: 'Trincados', value: stats.quality.cracked, color: '#ef4444' }, { label: 'Cama', value: stats.quality.floor, color: '#a855f7' }].map((seg, idx) => { 
      const percentage = seg.value / total; const dash = percentage * circumference; const offset = currentOffset; currentOffset -= dash; 
      return <circle key={idx} cx="50" cy="50" r="40" fill="transparent" stroke={seg.color} strokeWidth="12" strokeDasharray={`${dash} 251.32`} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
    })}
  </>);
};

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (<div className="relative"><select value={value} onChange={e => onChange(e.target.value)} className="appearance-none bg-gray-50 border border-gray-100 text-[10px] font-black py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer uppercase tracking-tight">{options.map(o => { const custom = customLabels?.find(cl => cl.value === o); return <option key={o} value={o}>{custom ? custom.label : o}</option>; })}</select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div>);
const QualityBox = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => { const colorMap: Record<string, string> = { emerald: 'text-emerald-600 border-emerald-100 bg-emerald-50/30', orange: 'text-orange-600 border-orange-100 bg-orange-50/30', red: 'text-red-600 border-red-100 bg-red-50/30', purple: 'text-purple-600 border-purple-100 bg-purple-50/30' }; return (<div className={`p-4 rounded-xl border ${colorMap[color]} transition-transform hover:scale-[1.02]`}><p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p><p className="text-lg font-black">{value.toLocaleString('pt-BR')}</p><p className="text-[9px] font-bold opacity-60">{((value / (total || 1)) * 100).toFixed(1)}%</p></div>); };
const KPICard = ({ title, value, subtext, icon, color }: { title: string, value: string, subtext: string, icon: React.ReactNode, color: string }) => { const colorMap: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600', red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600', indigo: 'bg-indigo-50 text-indigo-600' }; return (<div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5 w-full"><div className={`p-4 rounded-xl ${colorMap[color] || 'bg-gray-50'}`}>{React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 })}</div><div className="flex-1"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p><p className="text-2xl font-black text-gray-800 tracking-tight">{value}</p>{subtext && <p className="text-[9px] font-medium text-gray-400 mt-0.5">{subtext}</p>}</div></div>); };
