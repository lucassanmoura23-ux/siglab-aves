
import React, { useMemo, useState } from 'react';
import { Filter, Download, ChevronDown, Calendar, Bird, Egg, Scale, Weight, Activity } from 'lucide-react';
import { ProductionRecord } from '../types';

export const AviaryDashboard: React.FC<{ records: ProductionRecord[] }> = ({ records }) => {
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos Aviários');
  
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const [activeBarId, setActiveBarId] = useState<string | null>(null);
  
  const aviaryColors: Record<string, { 
    border: string, text: string, bg: string, stroke: string,
    gradientFrom: string, gradientTo: string 
  }> = {
    '1': { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-500', stroke: '#3b82f6', gradientFrom: 'from-blue-600', gradientTo: 'to-blue-400' },
    '2': { border: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500', stroke: '#10b981', gradientFrom: 'from-emerald-600', gradientTo: 'to-emerald-400' },
    '3': { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-500', stroke: '#f97316', gradientFrom: 'from-orange-600', gradientTo: 'to-orange-400' },
    '4': { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-500', stroke: '#a855f7', gradientFrom: 'from-purple-600', gradientTo: 'to-purple-400' },
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const id = aviaryFilter.replace(/\D/g, '');
      if (aviaryFilter !== 'Todos Aviários' && record.aviaryId !== id) return false;
      if (yearFilter !== '-- Por Ano --' && !record.date.startsWith(yearFilter)) return false;
      return true;
    });
  }, [records, aviaryFilter, yearFilter]);

  const stats = useMemo(() => {
    const ids = ['1', '2', '3', '4'];
    return ids.map(id => {
      const avRecs = filteredRecords.filter(r => r.aviaryId === id).sort((a, b) => a.date.localeCompare(b.date));
      if (avRecs.length === 0) return { id, totalEggs: 0, liveBirds: 0, layingRate: 0, quality: { limpos: 0, sujos: 0, trincados: 0, cama: 0 }, avgEggWeight: 0, avgBirdWeight: 0, mortality: 0 };
      
      const totalEggs = avRecs.reduce((s, r) => s + r.metrics.totalEggs, 0);
      const latestBirds = avRecs[avRecs.length - 1].liveBirds;
      const totalMortality = avRecs.reduce((s, r) => s + r.mortality, 0);
      const avgRate = avRecs.reduce((s, r) => s + (r.metrics?.layingRate || 0), 0) / avRecs.length;
      
      const quality = {
        limpos: avRecs.reduce((s, r) => s + r.cleanEggs, 0),
        sujos: avRecs.reduce((s, r) => s + r.dirtyEggs, 0),
        trincados: avRecs.reduce((s, r) => s + r.crackedEggs, 0),
        cama: avRecs.reduce((s, r) => s + r.floorEggs, 0)
      };

      const avgEggW = avRecs.filter(r => r.eggWeightAvg > 0).reduce((s, r) => s + r.eggWeightAvg, 0) / (avRecs.filter(r => r.eggWeightAvg > 0).length || 1);
      const avgBirdW = avRecs.filter(r => r.birdWeightAvg > 0).reduce((s, r) => s + r.birdWeightAvg, 0) / (avRecs.filter(r => r.birdWeightAvg > 0).length || 1);

      return { id, totalEggs, liveBirds: latestBirds, layingRate: avgRate, quality, avgEggWeight: avgEggW, avgBirdWeight: avgBirdW, mortality: totalMortality };
    });
  }, [filteredRecords]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, '1': 0, '2': 0, '3': 0, '4': 0 }));
    filteredRecords.forEach(r => {
      const dateParts = r.date.split('-');
      if (dateParts.length === 3) {
        const mIdx = parseInt(dateParts[1]) - 1;
        if (data[mIdx]) {
          const id = r.aviaryId as '1' | '2' | '3' | '4';
          data[mIdx][id] += r.metrics.totalEggs;
        }
      }
    });
    return data;
  }, [filteredRecords]);

  const renderLineChart = () => {
    const h = 200; const w = 800; const p = 40;
    const maxVal = Math.max(...chartData.map((d: any) => Math.max(d[1], d[2], d[3], d[4]))) || 1000;
    const getX = (i: number) => p + (i * (w - p * 2) / 11);
    const getY = (v: number) => h - p - (v / maxVal) * (h - p * 2);
    const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return (
      <div className="relative w-full h-full touch-none overflow-visible">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
          {[0, 0.5, 1].map(v => (<line key={v} x1={p} y1={getY(v * maxVal)} x2={w - p} y2={getY(v * maxVal)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />))}
          {['1', '2', '3', '4'].map(id => {
            if (aviaryFilter !== 'Todos Aviários' && aviaryFilter.replace(/\D/g, '') !== id) return null;
            const hasData = chartData.some((d: any) => d[id] > 0);
            if (!hasData) return null;
            const points = chartData.map((d: any, i: number) => `${getX(i)},${getY(d[id])}`).join(' ');
            return <polyline key={id} points={points} fill="none" stroke={aviaryColors[id].stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />;
          })}
          {chartData.map((d: any, i: number) => (<text key={i} x={getX(i)} y={h - 10} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">{d.name}</text>))}
          {chartData.map((_, i) => (<rect key={i} x={getX(i) - 20} y={0} width="40" height={h} fill="transparent" className="cursor-pointer" onMouseEnter={() => setActiveLineIdx(i)} onMouseLeave={() => setActiveLineIdx(null)} />))}
        </svg>

        {/* Tooltip Renderizado no Hover */}
        {activeLineIdx !== null && (
          <div 
            className="absolute top-0 bg-white/95 backdrop-blur-md shadow-xl border border-gray-100 p-3 rounded-xl text-[10px] z-20 pointer-events-none min-w-[150px] animate-in fade-in zoom-in-95 duration-200" 
            style={{ 
              left: activeLineIdx > 8 ? 'auto' : `${(getX(activeLineIdx)/w)*100}%`, 
              right: activeLineIdx > 8 ? '0' : 'auto',
              transform: activeLineIdx > 8 ? 'translateX(0)' : 'translateX(10px)'
            }}
          >
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-50">
               <Calendar size={12} className="text-blue-500" />
               <p className="font-black text-gray-800 uppercase tracking-tight">{monthsFull[activeLineIdx]}</p>
            </div>
            <div className="space-y-1.5">
              {['1', '2', '3', '4'].map(id => {
                if (aviaryFilter !== 'Todos Aviários' && aviaryFilter.replace(/\D/g, '') !== id) return null;
                const val = chartData[activeLineIdx][id as '1'];
                return (
                  <div key={id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: aviaryColors[id].stroke }}></div>
                      <span className="font-bold text-gray-500">Aviário {id}:</span>
                    </div>
                    <span className="font-black text-gray-900">{val.toLocaleString('pt-BR')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-2">
        <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs font-bold uppercase outline-none flex-1"><option>Todo o Período</option></select>
        <select value={aviaryFilter} onChange={e => setAviaryFilter(e.target.value)} className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs font-bold uppercase outline-none flex-1"><option>Todos Aviários</option><option>Aviário 1</option><option>Aviário 2</option><option>Aviário 3</option><option>Aviário 4</option></select>
        <button onClick={() => {setAviaryFilter('Todos Aviários'); setYearFilter('-- Por Ano --');}} className="text-[10px] font-black text-blue-600 uppercase">Limpar Filtros</button>
      </div>
      <div className="flex justify-between items-center px-1"><h2 className="text-lg font-black text-[#1e293b] uppercase tracking-tight">Análise Individual de Aviários</h2><button className="bg-emerald-500 text-white p-2 rounded-lg shadow-sm"><Download size={16} /></button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter(av => av.totalEggs > 0 || aviaryFilter === 'Todos Aviários').map((av: any) => (
          <div key={av.id} className={`bg-white rounded-xl border-t-4 shadow-sm ${aviaryColors[av.id].border} overflow-hidden`}>
            <div className="p-4 flex justify-between items-center border-b border-gray-50 bg-gray-50/20"><span className="font-black text-gray-900 text-sm">Aviário {av.id}</span><span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Taxa: <span className="text-sm">{av.layingRate.toFixed(1)}%</span></span></div>
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-50"><div><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL OVOS</p><p className="text-xl font-black text-gray-800">{av.totalEggs.toLocaleString('pt-BR')}</p></div><div className="text-right"><p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">AVES VIVAS</p><p className="text-xl font-black text-blue-900">{av.liveBirds.toLocaleString('pt-BR')}</p></div></div>
            <div className="p-4 space-y-2"><p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">QUALIDADE ACUMULADA</p><QualityItem label="Limpos" value={av.quality.limpos} total={av.totalEggs} color="bg-emerald-500" /><QualityItem label="Sujos" value={av.quality.sujos} total={av.totalEggs} color="bg-orange-500" /><QualityItem label="Trincados" value={av.quality.trincados} total={av.totalEggs} color="bg-red-500" /></div>
            <div className="p-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-50 mt-2"><span className="text-[9px] font-black text-gray-400 uppercase">Mortalidade:</span><span className="text-sm font-black text-red-500">{av.mortality}</span></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><div className="flex items-center justify-between mb-8"><h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><div className="w-2 h-4 bg-blue-500 rounded-full"></div> Produção Mensal (Ovos)</h3></div><div className="h-64 w-full">{renderLineChart()}</div></div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><div className="flex items-center justify-between mb-8"><h3 className="text-sm font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><div className="w-2 h-4 bg-emerald-500 rounded-full"></div> Taxa de Postura Média (%)</h3></div><div className="h-64 flex items-end justify-around border-b border-gray-100 pb-2 relative">
            {stats.map((av: any) => (
              <div key={av.id} className="flex flex-col items-center w-full relative group cursor-pointer" onClick={() => setActiveBarId(activeBarId === av.id ? null : av.id)}>
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] p-1.5 rounded font-black whitespace-nowrap z-10">{av.layingRate.toFixed(1)}%</div>
                <div 
                  className={`w-8 md:w-12 rounded-t-lg bg-gradient-to-b ${aviaryColors[av.id].gradientFrom} ${aviaryColors[av.id].gradientTo} shadow-lg shadow-gray-100 animate-grow-v`} 
                  style={{ height: `${Math.max(2, Math.min(100, av.layingRate) * 1.5)}px` }} 
                />
                <span className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-tighter">AV. {av.id}</span>
              </div>
            ))}
          </div></div>
      </div>
    </div>
  );
};

const QualityItem = ({ label, value, total, color }: any) => (
  <div className="flex justify-between items-center text-[10px]"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${color}`} /><span className="font-bold text-gray-600">{label}</span></div><div className="text-right"><span className="font-black text-gray-800">{value.toLocaleString('pt-BR')}</span><span className="text-gray-400 ml-1 text-[9px]">({total > 0 ? ((value/total)*100).toFixed(1) : '0.0'}%)</span></div></div>
);

interface AviaryDashboardProps { records: ProductionRecord[]; }
