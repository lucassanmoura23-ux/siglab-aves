
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
  '1': '#3b82f6', // Blue
  '2': '#10b981', // Emerald
  '3': '#f59e0b', // Amber
  '4': '#a855f7'  // Purple
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

  const clearFilters = () => {
    setPeriodFilter('Todo o Período');
    setYearFilter('-- Por Ano --');
    setMonthFilter('-- Por Mês --');
    setFortnightFilter('-- Por Quinzena --');
    setAviaryFilter('Todos Aviários');
    setBatchFilter('-- Todos Lotes --');
  };

  const yearOptions = useMemo(() => {
    const years = (Array.from(new Set(records.map(r => r.date.split('-')[0]))) as string[])
      .sort((a, b) => b.localeCompare(a));
    return ['-- Por Ano --', ...years];
  }, [records]);

  const batchOptions = useMemo(() => {
    const batches = (Array.from(new Set(records.map(r => r.batchId))).filter(id => id && id !== '-') as string[])
      .sort((a, b) => a.localeCompare(b));
    return ['-- Todos Lotes --', ...batches];
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
      options.push({ label: `${MONTHS_SHORT[mIdx]}/${year} - 2ª Quinzena`, value: `${year}-${mIdx}-2` });
      options.push({ label: `${MONTHS_SHORT[mIdx]}/${year} - 1ª Quinzena`, value: `${year}-${mIdx}-1` });
    });

    return options;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const [rYearStr, rMonthStr, rDayStr] = record.date.split('-');
      const rMonth = parseInt(rMonthStr);
      const recordDate = new Date(record.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (aviaryFilter !== 'Todos Aviários' && record.aviaryId !== aviaryFilter.replace(/\D/g, '')) return false;
      if (batchFilter !== '-- Todos Lotes --' && record.batchId !== batchFilter) return false;
      if (yearFilter !== '-- Por Ano --' && rYearStr !== yearFilter) return false;
      
      if (monthFilter !== '-- Por Mês --') {
        const selectedMonthIdx = MONTHS.indexOf(monthFilter) + 1;
        if (rMonth !== selectedMonthIdx) return false;
      }

      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonthIdx, fPart] = fortnightFilter.split('-');
        if (rYearStr !== fYear || (rMonth - 1) !== parseInt(fMonthIdx)) return false;
        if (fPart === '1' && parseInt(rDayStr) > 15) return false;
        if (fPart === '2' && parseInt(rDayStr) <= 15) return false;
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

  const qualitySegments = useMemo(() => {
    if (!stats) return [];
    const { clean, dirty, cracked, floor, total } = stats.quality;
    const items = [
      { color: '#10b981', value: clean },
      { color: '#f97316', value: dirty },
      { color: '#ef4444', value: cracked },
      { color: '#a855f7', value: floor },
    ];
    let currentOffset = 0;
    const circumference = 251.32;
    return items.map(item => {
      const dash = (item.value / (total || 1)) * circumference;
      const offset = currentOffset;
      currentOffset -= dash;
      return { ...item, dash, offset };
    });
  }, [stats]);

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

  const renderLineChart = () => {
    const width = 800;
    const height = 250;
    const paddingLeft = 60; 
    const paddingRight = 40;
    const paddingTop = 30;
    const paddingBottom = 40;
    const isSingleAviary = aviaryFilter !== 'Todos Aviários';
    const activeId = isSingleAviary ? aviaryFilter.replace(/\D/g, '') : 'total';
    const lineColor = isSingleAviary ? AVIARY_COLORS[activeId] : '#2563eb';

    let maxVal = 0;
    Object.values(lineChartData).forEach((m: any) => {
      const val = isSingleAviary ? m[activeId] : m['total'];
      maxVal = Math.max(maxVal, val);
    });
    if (maxVal === 0) maxVal = 100;
    const yAxisMax = Math.ceil(maxVal / 1000) * 1000 || 1000;

    const getX = (idx: number) => paddingLeft + (idx * (width - paddingLeft - paddingRight) / 11);
    const getY = (val: number) => height - paddingBottom - (val / yAxisMax) * (height - paddingBottom - paddingTop);

    const points = Object.values(lineChartData).map((m: any, i) => ({ 
      x: getX(i), y: getY(isSingleAviary ? m[activeId] : m['total']) 
    }));

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i]; const next = points[i + 1]; const cx = (curr.x + next.x) / 2;
      d += ` C ${cx},${curr.y} ${cx},${next.y} ${next.x},${next.y}`;
    }

    return (
      <div className="relative w-full h-full group overflow-x-auto scrollbar-hide">
        <div className="min-w-[600px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map(p => {
              const yPos = height - paddingBottom - (p * (height - paddingBottom - paddingTop));
              const labelValue = Math.round(p * yAxisMax);
              return (
                <g key={p}>
                  <line x1={paddingLeft} y1={yPos} x2={width - paddingRight} y2={yPos} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={paddingLeft - 10} y={yPos + 3} textAnchor="end" className="text-[9px] fill-gray-400 font-bold">{labelValue >= 1000 ? `${(labelValue / 1000).toFixed(1)}k` : labelValue}</text>
                </g>
              );
            })}
            {MONTHS_SHORT.map((m, i) => (
              <text key={m} x={getX(i)} y={height - 20} textAnchor="middle" className="text-[10px] fill-gray-400 font-bold uppercase">{m}</text>
            ))}
            <path d={d} fill="none" stroke={lineColor} strokeWidth="4" strokeLinecap="round" className="transition-all duration-500 ease-in-out drop-shadow-sm" />
            {hoveredMonthIdx !== null && (
              <line x1={getX(hoveredMonthIdx)} y1={paddingTop} x2={getX(hoveredMonthIdx)} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
            )}
            {hoveredMonthIdx !== null && (
              <circle cx={getX(hoveredMonthIdx)} cy={getY(isSingleAviary ? (lineChartData[hoveredMonthIdx] as any)[activeId] : (lineChartData[hoveredMonthIdx] as any)['total'])} r="6" fill="white" stroke={lineColor} strokeWidth="4" />
            )}
            {MONTHS_SHORT.map((_, i) => (
              <rect key={i} x={getX(i) - 20} y={0} width="40" height={height} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(i)} onMouseLeave={() => setHoveredMonthIdx(null)} />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filtros Mobile-Friendly */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
           <Filter size={14} /> Filtros de Pesquisa
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3">
          <FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Últimos 7 dias', 'Últimos 30 dias', 'Mês Atual']} />
          <FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <FilterSelect value={monthFilter} onChange={setMonthFilter} options={['-- Por Mês --', ...MONTHS]} />
          <FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} />
          <FilterSelect value={batchFilter} onChange={setBatchFilter} options={batchOptions} />
          <button onClick={clearFilters} className="sm:ml-auto text-[10px] font-black text-blue-600 uppercase hover:underline py-2">Limpar Filtros</button>
        </div>
      </div>

      {!stats ? (
        <div className="p-10 md:p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 font-medium">Nenhum dado encontrado para os filtros selecionados.</div>
      ) : (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <KPICard title="Total Ovos" value={stats.totalEggs.toLocaleString('pt-BR')} subtext="(acumulado)" icon={<Egg />} color="blue" />
             <KPICard title="Taxa Postura" value={`${stats.avgLayingRate.toFixed(1)}%`} icon={<TrendingUp />} color="green" />
             <KPICard title="Aves Vivas" value={stats.currentBirds.toLocaleString('pt-BR')} icon={<Bird />} color="purple" />
             <KPICard title="Mortalidade" value={`${stats.totalMortality} (${stats.mortalityRate.toFixed(2)}%)`} icon={<AlertTriangle />} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-5 bg-indigo-600 rounded-full"></div> Qualidade dos Ovos
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <LegendItem label="Limpos" color="bg-emerald-500" /> 
                  <LegendItem label="Sujos" color="bg-orange-500" /> 
                  <LegendItem label="Trincados" color="bg-red-500" /> 
                  <LegendItem label="Cama" color="bg-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="relative flex justify-center">
                  <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-48 md:h-48 -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    {qualitySegments.map((seg, idx) => (
                      <circle key={idx} cx="50" cy="50" r="40" fill="transparent" stroke={seg.color} strokeWidth="12" strokeDasharray={`${seg.dash} 251.32`} strokeDashoffset={seg.offset} className="transition-all duration-1000 ease-out" />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-2xl md:text-3xl font-black text-gray-800 leading-none">{((stats.quality.clean / (stats.quality.total || 1)) * 100).toFixed(0)}%</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Ovos Limpos</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <QualityBox label="Limpos" value={stats.quality.clean} total={stats.quality.total} color="emerald" />
                  <QualityBox label="Sujos" value={stats.quality.dirty} total={stats.quality.total} color="orange" />
                  <QualityBox label="Trincados" value={stats.quality.cracked} total={stats.quality.total} color="red" />
                  <QualityBox label="Cama" value={stats.quality.floor} total={stats.quality.total} color="purple" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <KPICard title="Peso Ovos (g)" value={`${stats.avgEggWeight.toFixed(1)} g`} icon={<Scale />} color="teal" />
              <KPICard title="Peso Aves (g)" value={`${stats.avgBirdWeight.toFixed(1)} g`} icon={<Weight />} color="indigo" />
              <div className="sm:col-span-2 lg:col-span-1 bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-4 text-white">
                <div className="p-3 bg-white/20 rounded-xl"><CheckCircle2 size={24} /></div>
                <div><p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Status de Saúde</p><p className="text-lg font-black">Lote Saudável</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-4 md:p-8 rounded-2xl border border-gray-100 shadow-sm w-full">
               <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-2 mb-6">
                 <div className="w-2 h-5 bg-blue-600 rounded-full"></div> Produção Mensal
               </h3>
               <div className="h-64 w-full">{renderLineChart()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem: React.FC<{ label: string; color: string; customBg?: string }> = ({ label, color, customBg }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${color}`} style={customBg ? { backgroundColor: customBg } : {}}></div>
    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">{label}</span>
  </div>
);

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (
  <div className="relative w-full lg:w-auto">
    <select 
      value={value} onChange={e => onChange(e.target.value)}
      className="appearance-none w-full bg-gray-50 border border-gray-100 text-[10px] font-black py-2.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer uppercase tracking-tight"
    >
      {options.map(o => {
        const custom = customLabels?.find(cl => cl.value === o);
        return <option key={o} value={o}>{custom ? custom.label : o}</option>;
      })}
    </select>
    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

const QualityBox = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => {
  const colorMap: Record<string, string> = { emerald: 'text-emerald-600 border-emerald-100 bg-emerald-50/30', orange: 'text-orange-600 border-orange-100 bg-orange-50/30', red: 'text-red-600 border-red-100 bg-red-50/30', purple: 'text-purple-600 border-purple-100 bg-purple-50/30' };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} transition-transform hover:scale-[1.02]`}>
      <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
      <p className="text-base md:text-lg font-black">{value.toLocaleString('pt-BR')}</p>
      <p className="text-[9px] font-bold opacity-60">{((value / (total || 1)) * 100).toFixed(1)}%</p>
    </div>
  );
};

const KPICard = ({ title, value, subtext, icon, color }: { title: string, value: string, subtext?: string, icon: React.ReactElement, color: string }) => {
  const colorMap: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600', red: 'bg-red-50 text-red-600', teal: 'bg-teal-50 text-teal-600', indigo: 'bg-indigo-50 text-indigo-600' };
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 md:gap-5 w-full">
      <div className={`p-3 md:p-4 rounded-xl ${colorMap[color] || 'bg-gray-50'}`}>{React.cloneElement(icon as React.ReactElement<any>, { size: 20, strokeWidth: 2.5 })}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1 truncate">{title}</p>
        <p className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">{value}</p>
        {subtext && <p className="text-[9px] font-medium text-gray-400 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
};
