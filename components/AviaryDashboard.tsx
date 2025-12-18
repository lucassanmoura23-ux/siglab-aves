
import React, { useMemo, useState } from 'react';
import { Filter, Download, ChevronDown, Calendar } from 'lucide-react';
import { ProductionRecord } from '../types';

export const AviaryDashboard: React.FC<AviaryDashboardProps> = ({ records }) => {
  // Filter States
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos Aviários');
  
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  
  const aviaryColors: Record<string, { 
    border: string, 
    text: string, 
    bg: string, 
    stroke: string,
    gradientFrom: string,
    gradientTo: string 
  }> = {
    '1': { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500', stroke: '#3b82f6', gradientFrom: 'from-blue-600', gradientTo: 'to-blue-400' },
    '2': { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500', stroke: '#10b981', gradientFrom: 'from-emerald-600', gradientTo: 'to-emerald-400' },
    '3': { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-500', stroke: '#f97316', gradientFrom: 'from-orange-600', gradientTo: 'to-orange-400' },
    '4': { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-500', stroke: '#a855f7', gradientFrom: 'from-purple-600', gradientTo: 'to-purple-400' },
  };

  const fortnightOptions = useMemo(() => {
    const options: { label: string, value: string }[] = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const uniquePeriods = new Set<string>();
    records.forEach(r => {
      if (!r.date) return;
      const [yearStr, monthStr] = r.date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      uniquePeriods.add(`${year}-${month}`);
    });
    const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => {
       const [y1, m1] = a.split('-').map(Number);
       const [y2, m2] = b.split('-').map(Number);
       if (y1 !== y2) return y2 - y1;
       return m2 - m1;
    });
    if (sortedPeriods.length === 0) sortedPeriods.push(`${new Date().getFullYear()}-${new Date().getMonth()}`);
    sortedPeriods.forEach(period => {
      const [year, month] = period.split('-').map(Number);
      options.push({ label: `${months[month]}/${year} - 2ª Quinzena`, value: `${year}-${month}-2` });
      options.push({ label: `${months[month]}/${year} - 1ª Quinzena`, value: `${year}-${month}-1` });
    });
    return options;
  }, [records]);

  const yearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(records.map(r => parseInt(r.date.split('-')[0], 10))))
      .sort((a, b) => b - a);
    return uniqueYears.length === 0 ? [new Date().getFullYear()] : uniqueYears;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (aviaryFilter !== 'Todos Aviários' && record.aviaryId !== aviaryFilter.replace(/\D/g, '')) return false;
      if (periodFilter !== 'Todo o Período') {
        const diffDays = Math.ceil(Math.abs(today.getTime() - recordDate.getTime()) / (1000 * 3600 * 24)); 
        if (periodFilter === 'Últimos 7 dias' && diffDays > 7) return false;
        if (periodFilter === 'Últimos 30 dias' && diffDays > 30) return false;
        if (periodFilter === 'Mês Atual') {
           const [rYear, rMonth] = record.date.split('-').map(Number);
           if (rMonth !== (today.getMonth() + 1) || rYear !== today.getFullYear()) return false;
        }
      }
      if (yearFilter !== '-- Por Ano --' && parseInt(record.date.split('-')[0], 10) !== parseInt(yearFilter, 10)) return false;
      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonth, fPart] = fortnightFilter.split('-').map(Number);
        const [rYear, rMonth, rDay] = record.date.split('-').map(Number);
        if (rYear !== fYear || (rMonth - 1) !== fMonth) return false;
        if (fPart === 1 && rDay > 15) return false;
        if (fPart === 2 && rDay <= 15) return false;
      }
      return true;
    });
  }, [records, aviaryFilter, periodFilter, yearFilter, fortnightFilter]);

  const stats = useMemo(() => {
    const aviariesToProcess = aviaryFilter !== 'Todos Aviários' ? [aviaryFilter.replace(/\D/g, '')] : ['1', '2', '3', '4'];
    return aviariesToProcess.map(aviaryId => {
      const aviaryRecords = filteredRecords.filter(r => r.aviaryId === aviaryId).sort((a, b) => a.date.localeCompare(b.date));
      if (aviaryRecords.length === 0) return null;
      const totalEggs = aviaryRecords.reduce((sum, r) => sum + r.metrics.totalEggs, 0);
      const cleanEggs = aviaryRecords.reduce((sum, r) => sum + r.cleanEggs, 0);
      const dirtyEggs = aviaryRecords.reduce((sum, r) => sum + r.dirtyEggs, 0);
      const crackedEggs = aviaryRecords.reduce((sum, r) => sum + r.crackedEggs, 0);
      const floorEggs = aviaryRecords.reduce((sum, r) => sum + r.floorEggs, 0);
      const totalMortality = aviaryRecords.reduce((sum, r) => sum + r.mortality, 0);
      const avgEggWeight = aviaryRecords.reduce((sum, r) => sum + r.eggWeightAvg, 0) / (aviaryRecords.filter(r => r.eggWeightAvg > 0).length || 1);
      const avgBirdWeight = aviaryRecords.reduce((sum, r) => sum + r.birdWeightAvg, 0) / (aviaryRecords.filter(r => r.birdWeightAvg > 0).length || 1);
      const avgLayingRate = aviaryRecords.reduce((sum, r) => sum + r.metrics.layingRate, 0) / aviaryRecords.length;
      return { id: aviaryId, currentBirds: aviaryRecords[aviaryRecords.length - 1].liveBirds, totalEggs, cleanEggs, dirtyEggs, crackedEggs, floorEggs, totalMortality, avgEggWeight, avgBirdWeight, avgLayingRate, records: aviaryRecords };
    }).filter(Boolean) as any[]; 
  }, [filteredRecords, aviaryFilter]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dataByMonth: any = {};
    months.forEach((m, i) => { dataByMonth[i] = { name: m, 1: 0, 2: 0, 3: 0, 4: 0 }; });
    filteredRecords.forEach(r => {
        const monthIndex = new Date(r.date).getMonth();
        if (dataByMonth[monthIndex]) dataByMonth[monthIndex][r.aviaryId] += r.metrics.totalEggs;
    });
    return Object.values(dataByMonth) as any[];
  }, [filteredRecords]);

  const renderLineChart = () => {
    const height = 220; const width = 800; const padding = 40;
    const maxVal = Math.max(...chartData.map((d: any) => Math.max(d[1], d[2], d[3], d[4]))) || 100;
    const getX = (index: number) => padding + (index * (width - padding * 2) / 11);
    const getY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

    return (
      <div className="relative w-full h-full overflow-x-auto scrollbar-hide">
        <div className="min-w-[600px] h-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map(p => (
                <line key={p} x1={padding} y1={height - padding - (p * (height - padding * 2))} x2={width - padding} y2={height - padding - (p * (height - padding * 2))} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {['1', '2', '3', '4'].map(id => {
              const points = chartData.map((d: any, i: number) => `${getX(i)},${getY(d[id])}`).join(' ');
              return <polyline key={id} points={points} fill="none" stroke={aviaryColors[id].stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
            })}
            {chartData.map((d: any, i: number) => (
                <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#9ca3af">{d.name}</text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
           <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-tight">
              <option>Todo o Período</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option><option>Mês Atual</option>
           </select>
           <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-tight">
              <option>-- Por Ano --</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
           <select value={fortnightFilter} onChange={(e) => setFortnightFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-tight">
              <option>-- Por Quinzena --</option>{fortnightOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
           </select>
           <select value={aviaryFilter} onChange={(e) => setAviaryFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-black uppercase tracking-tight">
              <option>Todos Aviários</option><option>Aviário 1</option><option>Aviário 2</option><option>Aviário 3</option><option>Aviário 4</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(av => (
            <div key={av.id} className={`bg-white rounded-xl border-t-4 shadow-sm overflow-hidden ${aviaryColors[av.id].border}`}>
                <div className="px-4 py-3 flex justify-between items-center bg-gray-50/50">
                    <span className="font-black text-gray-800 text-xs uppercase tracking-widest">Aviário {av.id}</span>
                    <span className={`text-[10px] font-black ${av.avgLayingRate >= 90 ? 'text-green-600' : 'text-orange-600'}`}>{av.avgLayingRate.toFixed(1)}%</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <div><p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Ovos</p><p className="text-lg font-black text-gray-800">{av.totalEggs.toLocaleString()}</p></div>
                    <div className="text-right"><p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Aves</p><p className="text-lg font-black text-blue-600">{av.currentBirds.toLocaleString()}</p></div>
                </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
             <h3 className="font-black text-xs md:text-sm text-gray-700 uppercase tracking-widest mb-6">Produção Mensal</h3>
             <div className="h-64 w-full">{renderLineChart()}</div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
             <h3 className="font-black text-xs md:text-sm text-gray-700 uppercase tracking-widest mb-6">Taxa de Postura (%)</h3>
             <div className="h-64 flex items-end justify-around border-b border-gray-100 pb-2">
                {stats.map(av => (
                    <div key={av.id} className="flex flex-col items-center w-full">
                         <div className={`w-8 md:w-12 rounded-t-lg bg-gradient-to-b ${aviaryColors[av.id].gradientFrom} ${aviaryColors[av.id].gradientTo} shadow-md transition-all`} style={{ height: `${Math.min(av.avgLayingRate, 100) * 1.5}px` }} />
                         <span className="text-[10px] text-gray-500 mt-2 font-black uppercase">Av {av.id}</span>
                    </div>
                ))}
             </div>
          </div>
      </div>
    </div>
  );
};

interface AviaryDashboardProps { records: ProductionRecord[]; }
