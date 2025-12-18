
import React, { useMemo, useState } from 'react';
import { Filter, Download, ChevronDown, Calendar } from 'lucide-react';
import { ProductionRecord } from '../types';

export const AviaryDashboard: React.FC<AviaryDashboardProps> = ({ records }) => {
  // Filter States
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos Aviários');
  
  // State for Chart Tooltips
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null); // Line Chart
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);     // Bar Chart
  
  // Cores temáticas com Gradientes
  const aviaryColors: Record<string, { 
    border: string, 
    text: string, 
    bg: string, 
    stroke: string,
    gradientFrom: string,
    gradientTo: string 
  }> = {
    '1': { 
      border: 'border-blue-500', 
      text: 'text-blue-600', 
      bg: 'bg-blue-500', 
      stroke: '#3b82f6',
      gradientFrom: 'from-blue-600',
      gradientTo: 'to-blue-400'
    },
    '2': { 
      border: 'border-emerald-500', 
      text: 'text-emerald-600', 
      bg: 'bg-emerald-500', 
      stroke: '#10b981',
      gradientFrom: 'from-emerald-600',
      gradientTo: 'to-emerald-400'
    },
    '3': { 
      border: 'border-orange-500', 
      text: 'text-orange-600', 
      bg: 'bg-orange-500', 
      stroke: '#f97316',
      gradientFrom: 'from-orange-600',
      gradientTo: 'to-orange-400'
    },
    '4': { 
      border: 'border-purple-500', 
      text: 'text-purple-600', 
      bg: 'bg-purple-500', 
      stroke: '#a855f7',
      gradientFrom: 'from-purple-600',
      gradientTo: 'to-purple-400'
    },
  };

  // Helper: Generate Fortnight Options ONLY for recorded months
  const fortnightOptions = useMemo(() => {
    const options: { label: string, value: string }[] = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Set to store unique "Year-Month" keys (e.g., "2024-0" for Jan 2024)
    const uniquePeriods = new Set<string>();

    records.forEach(r => {
      if (!r.date) return;
      const [yearStr, monthStr] = r.date.split('-');
      // Added radix 10 to parseInt for better type safety and consistency
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // 0-indexed for array access
      uniquePeriods.add(`${year}-${month}`);
    });

    // Sort periods descending (newest first)
    const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => {
       // Fix: Split strings and convert to numbers explicitly for arithmetic sorting
       const aParts = a.split('-');
       const bParts = b.split('-');
       const y1 = Number(aParts[0]);
       const m1 = Number(aParts[1]);
       const y2 = Number(bParts[0]);
       const m2 = Number(bParts[1]);
       // Fix arithmetic comparison errors by ensuring numeric subtraction
       if (y1 !== y2) return (y2 as number) - (y1 as number);
       return (m2 as number) - (m1 as number);
    });

    // If no records, maybe show current month as fallback
    if (sortedPeriods.length === 0) {
       const today = new Date();
       sortedPeriods.push(`${today.getFullYear()}-${today.getMonth()}`);
    }

    sortedPeriods.forEach(period => {
      const [year, month] = period.split('-').map(Number);
      // Push 2nd fortnight first (descending time logic)
      options.push({ label: `${months[month]}/${year} - 2ª Quinzena`, value: `${year}-${month}-2` });
      options.push({ label: `${months[month]}/${year} - 1ª Quinzena`, value: `${year}-${month}-1` });
    });

    return options;
  }, [records]);

  // Helper: Generate Year Options based on recorded years
  const yearOptions = useMemo(() => {
    // Extract unique years from records string to avoid timezone issues. Added radix 10.
    const uniqueYears = Array.from(new Set(records.map(r => parseInt(r.date.split('-')[0], 10))))
      .sort((a, b) => (b as number) - (a as number));
    
    if (uniqueYears.length === 0) {
      return [new Date().getFullYear()];
    }
    return uniqueYears;
  }, [records]);

  // Filter Records BEFORE stats calculation
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = new Date(record.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Aviary Filter
      if (aviaryFilter !== 'Todos Aviários') {
         // Extract number from "Aviário 1"
         const id = aviaryFilter.replace(/\D/g, '');
         if (record.aviaryId !== id) return false;
      }

      // 2. Period Filter
      if (periodFilter !== 'Todo o Período') {
        // Fix: Use getTime() and Number cast to ensure numeric conversion for arithmetic comparison between Dates
        const diffTime = Math.abs(Number(today.getTime()) - Number(recordDate.getTime()));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (periodFilter === 'Últimos 7 dias') {
           if (diffDays > 7) return false;
        } else if (periodFilter === 'Últimos 30 dias') {
           if (diffDays > 30) return false;
        } else if (periodFilter === 'Mês Atual') {
           // Use raw string check for month/year to avoid timezone offset issues
           const [rYear, rMonth] = record.date.split('-').map(Number);
           const tYear = today.getFullYear();
           const tMonth = today.getMonth() + 1; // 1-indexed
           if (rMonth !== tMonth || rYear !== tYear) return false;
        }
      }

      // 3. Year Filter
      if (yearFilter !== '-- Por Ano --') {
        const rYear = parseInt(record.date.split('-')[0], 10);
        if (rYear !== parseInt(yearFilter, 10)) return false;
      }

      // 4. Fortnight Filter
      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonth, fPart] = fortnightFilter.split('-').map(Number);
        const [rYear, rMonth, rDay] = record.date.split('-').map(Number);
        
        // Check Year and Month (rMonth is 1-indexed, fMonth is 0-indexed from our generator)
        if (rYear !== fYear || (rMonth - 1) !== fMonth) return false;
        
        if (fPart === 1) { // 1st Quinzena (1-15)
          if (rDay > 15) return false;
        } else { // 2nd Quinzena (16-End)
          if (rDay <= 15) return false;
        }
      }

      return true;
    });
  }, [records, aviaryFilter, periodFilter, yearFilter, fortnightFilter]);


  // Processamento dos dados (Using Filtered Records)
  const stats = useMemo(() => {
    const aviariesToProcess = aviaryFilter !== 'Todos Aviários' 
      ? [aviaryFilter.replace(/\D/g, '')] 
      : ['1', '2', '3', '4'];
    
    return aviariesToProcess.map(aviaryId => {
      const aviaryRecords = filteredRecords
        .filter(r => r.aviaryId === aviaryId)
        // Fix: Use getTime() and explicit Number conversion to ensure primitive number conversion for numeric sort
        .sort((a, b) => Number(new Date(a.date).getTime()) - Number(new Date(b.date).getTime()));

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

      const lastRecord = aviaryRecords[aviaryRecords.length - 1];

      return {
        id: aviaryId,
        currentBirds: lastRecord.liveBirds,
        totalEggs,
        cleanEggs,
        dirtyEggs,
        crackedEggs,
        floorEggs,
        totalMortality,
        avgEggWeight,
        avgBirdWeight,
        avgLayingRate,
        records: aviaryRecords
      };
    }).filter(Boolean) as any[]; 
  }, [filteredRecords, aviaryFilter]);

  // Dados para o gráfico de linhas (Agrupado por mês)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dataByMonth: any = {};

    months.forEach((m, i) => {
        dataByMonth[i] = { name: m, 1: 0, 2: 0, 3: 0, 4: 0 };
    });

    filteredRecords.forEach(r => {
        const date = new Date(r.date);
        const monthIndex = date.getMonth();
        if (dataByMonth[monthIndex]) {
            dataByMonth[monthIndex][r.aviaryId] += r.metrics.totalEggs;
        }
    });

    return Object.values(dataByMonth);
  }, [filteredRecords]);

  // --- CHART HELPERS: BEZIER CURVE LOGIC ---
  const getControlPoint = (current: number[], previous: number[], next: number[], reverse: boolean = false) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2; // 0 to 1
    const opposedLine = [n[0] - p[0], n[1] - p[1]];
    const length = Math.sqrt(Math.pow(opposedLine[0], 2) + Math.pow(opposedLine[1], 2));
    const angle = Math.atan2(opposedLine[1], opposedLine[0]) + (reverse ? Math.PI : 0);
    const lengthScaled = length * smoothing;
    const x = current[0] + Math.cos(angle) * lengthScaled;
    const y = current[1] + Math.sin(angle) * lengthScaled;
    return [x, y];
  };

  const createBezierPath = (points: number[][]) => {
    if (points.length === 0) return '';
    
    // Command: Move to first point
    let d = `M ${points[0][0]},${points[0][1]}`;

    for (let i = 0; i < points.length - 1; i++) {
      const [p0x, p0y] = points[i];
      const [p1x, p1y] = points[i + 1];
      
      const [cp1x, cp1y] = getControlPoint(
        [p0x, p0y], 
        points[i - 1], 
        [p1x, p1y]
      );
      
      const [cp2x, cp2y] = getControlPoint(
        [p1x, p1y], 
        [p0x, p0y], 
        points[i + 2], 
        true
      );

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1x},${p1y}`;
    }
    return d;
  };

  // Helper para desenhar o gráfico de linhas SVG e Tooltip
  const renderLineChart = () => {
    const height = 220;
    const width = 800;
    const padding = 40;
    const maxVal = Math.max(...chartData.map((d: any) => Math.max(d[1], d[2], d[3], d[4]))) || 100;
    
    const getX = (index: number) => padding + (index * (width - padding * 2) / 11);
    const getY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);

    // Prepare paths data
    const pathsData = ['1', '2', '3', '4'].map(id => {
      const points = chartData.map((d: any, i: number) => [getX(i), getY(d[id])]);
      const d = createBezierPath(points);
      return { id, d, color: aviaryColors[id].stroke };
    });

    return (
      <div className="relative w-full h-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines (Dashed & Subtle) */}
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
              <line 
                  key={p} 
                  x1={padding} 
                  y1={height - padding - (p * (height - padding * 2))} 
                  x2={width - padding} 
                  y2={height - padding - (p * (height - padding * 2))} 
                  stroke="#f3f4f6" 
                  strokeWidth="1"
                  strokeDasharray="4 4" 
              />
          ))}
          
          {/* Data Lines (Smooth Bezier) */}
          {pathsData.map(p => (
            <path
              key={p.id}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-md transition-all duration-500 ease-in-out hover:stroke-[4]"
              style={{ opacity: hoveredIndex !== null && chartData[hoveredIndex][p.id] === 0 ? 0.3 : 1 }}
            />
          ))}

          {/* Hover Vertical Line */}
          {hoveredIndex !== null && (
            <line 
              x1={getX(hoveredIndex)}
              y1={padding}
              x2={getX(hoveredIndex)}
              y2={height - padding}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {/* Hover Points (Fancy Rings) */}
          {hoveredIndex !== null && ['1', '2', '3', '4'].map(id => {
             const val = chartData[hoveredIndex][id];
             if (val === 0) return null; 
             return (
               <g key={id}>
                 <circle 
                    cx={getX(hoveredIndex)}
                    cy={getY(val)}
                    r="6"
                    fill="white"
                    stroke={aviaryColors[id].stroke}
                    strokeWidth="3"
                    className="shadow-sm"
                 />
                 {/* Inner dot */}
                 <circle 
                    cx={getX(hoveredIndex)}
                    cy={getY(val)}
                    r="3"
                    fill={aviaryColors[id].stroke}
                 />
               </g>
             );
          })}

          {/* X Axis Labels */}
          {chartData.map((d: any, i: number) => (
              <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fontSize="10" fontWeight="500" fill="#9ca3af">
                  {d.name}
              </text>
          ))}

          {/* Y Axis Labels */}
          {[0, 0.5, 1].map(p => (
               <text key={p} x={padding - 10} y={height - padding - (p * (height - padding * 2)) + 3} textAnchor="end" fontSize="10" fontWeight="500" fill="#9ca3af">
                  {Math.round(p * maxVal)}
               </text>
          ))}

          {/* Invisible Hit Areas */}
          {chartData.map((_, i) => (
            <rect
              key={i}
              x={getX(i) - ((width - padding * 2) / 11) / 2}
              y={0}
              width={(width - padding * 2) / 11}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && (
           <div 
              className="absolute bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/50 ring-1 ring-gray-100 text-xs z-20 pointer-events-none transition-all duration-100 min-w-[150px]"
              style={{ 
                top: '0%', 
                left: hoveredIndex > 8 ? 'auto' : `${(getX(hoveredIndex) / width) * 100}%`,
                right: hoveredIndex > 8 ? '5%' : 'auto',
                transform: hoveredIndex > 8 ? 'none' : 'translateX(10px) translateY(10px)'
              }}
           >
              <div className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1 flex items-center gap-2">
                 <Calendar size={12} className="text-gray-400"/>
                 {chartData[hoveredIndex].name}
              </div>
              <div className="space-y-1.5">
                 {['1', '2', '3', '4'].map(id => (
                   <div key={id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${aviaryColors[id].bg}`}></div>
                        <span className="text-gray-500 font-medium">Aviário {id}</span>
                      </div>
                      <span className="font-bold text-gray-800 font-mono">
                        {chartData[hoveredIndex][id].toLocaleString()}
                      </span>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    );
  };

  const clearFilters = () => {
    setPeriodFilter('Todo o Período');
    setYearFilter('-- Por Ano --');
    setFortnightFilter('-- Por Quinzena --');
    setAviaryFilter('Todos Aviários');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm font-medium">
          <Filter size={16} />
          <span>Filtros:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Period Filter */}
           <div className="relative">
             <select 
               value={periodFilter}
               onChange={(e) => {
                 setPeriodFilter(e.target.value);
                 if (e.target.value !== 'Todo o Período') {
                   setYearFilter('-- Por Ano --');
                   setFortnightFilter('-- Por Quinzena --');
                 }
               }}
               className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option>Todo o Período</option>
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Mês Atual</option>
             </select>
             <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
           </div>

           {/* Year Filter */}
           <div className="relative">
             <select 
               value={yearFilter}
               onChange={(e) => {
                 setYearFilter(e.target.value);
                 if(e.target.value !== '-- Por Ano --') setPeriodFilter('Todo o Período');
               }}
               className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option>-- Por Ano --</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
             </select>
             <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
           </div>

           {/* Fortnight Filter */}
           <div className="relative">
             <select 
               value={fortnightFilter}
               onChange={(e) => {
                 setFortnightFilter(e.target.value);
                 if(e.target.value !== '-- Por Quinzena --') setPeriodFilter('Todo o Período');
               }}
               className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option>-- Por Quinzena --</option>
                {fortnightOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
             <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
           </div>

           {/* Aviary Filter */}
           <div className="relative">
             <select 
               value={aviaryFilter}
               onChange={(e) => setAviaryFilter(e.target.value)}
               className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option>Todos Aviários</option>
                <option>Aviário 1</option>
                <option>Aviário 2</option>
                <option>Aviário 3</option>
                <option>Aviário 4</option>
             </select>
             <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
           </div>
        </div>
         <div className="flex justify-end mt-2">
            <button 
              onClick={clearFilters}
              className="text-xs text-blue-600 font-medium hover:text-blue-800"
            >
              Limpar Filtros
            </button>
         </div>
      </div>

      <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Comparativo por Aviário</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition shadow-sm shadow-green-200">
              <Download size={14} /> Exportar PDF
          </button>
      </div>

      {/* Cards dos Aviários */}
      <div className={`grid grid-cols-1 ${stats.length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-4'} gap-4`}>
        {stats.length > 0 ? (
          stats.map(av => (
            <div key={av.id} className={`bg-white rounded-xl border-t-4 shadow-sm overflow-hidden ${aviaryColors[av.id].border}`}>
                {/* Header */}
                <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
                    <span className="font-bold text-gray-800">Aviário {av.id}</span>
                    <span className={`text-xs font-bold ${av.avgLayingRate >= 90 ? 'text-green-600' : av.avgLayingRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        Taxa: {av.avgLayingRate.toFixed(1)}%
                    </span>
                </div>

                {/* Blue Stats Box */}
                <div className="px-4 py-3 bg-blue-50/30 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Total Ovos</p>
                        <p className="text-lg font-bold text-gray-800">{av.totalEggs.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] text-gray-500 uppercase font-bold">Aves Vivas</p>
                         <p className="text-lg font-bold text-purple-900">{av.currentBirds.toLocaleString()}</p>
                    </div>
                </div>

                {/* Grey Stats Box */}
                <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Peso Médio Ovos:</span>
                        <span className="font-semibold text-gray-700">{av.avgEggWeight.toFixed(1)}g</span>
                    </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Peso Médio Aves:</span>
                        <span className="font-semibold text-gray-700">{av.avgBirdWeight.toFixed(1)}g</span>
                    </div>
                </div>

                {/* Quality Stats */}
                <div className="p-4 space-y-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">QUALIDADE</p>
                    
                    <div className="flex justify-between text-xs items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-600">Limpos</span>
                        </div>
                        <div>
                             <span className="font-bold text-gray-800 mr-1">{av.cleanEggs.toLocaleString()}</span>
                             <span className="text-gray-400 text-[10px]">({av.totalEggs > 0 ? ((av.cleanEggs/av.totalEggs)*100).toFixed(1) : '0.0'}%)</span>
                        </div>
                    </div>

                    <div className="flex justify-between text-xs items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-gray-600">Sujos</span>
                        </div>
                        <div>
                             <span className="font-bold text-gray-800 mr-1">{av.dirtyEggs.toLocaleString()}</span>
                             <span className="text-gray-400 text-[10px]">({av.totalEggs > 0 ? ((av.dirtyEggs/av.totalEggs)*100).toFixed(1) : '0.0'}%)</span>
                        </div>
                    </div>

                    <div className="flex justify-between text-xs items-center">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-gray-600">Trincados</span>
                        </div>
                        <div>
                             <span className="font-bold text-gray-800 mr-1">{av.crackedEggs.toLocaleString()}</span>
                             <span className="text-gray-400 text-[10px]">({av.totalEggs > 0 ? ((av.crackedEggs/av.totalEggs)*100).toFixed(1) : '0.0'}%)</span>
                        </div>
                    </div>

                    {(av.floorEggs > 0 || ['2','4'].includes(av.id)) && (
                        <div className="flex justify-between text-xs items-center">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span className="text-gray-600">Cama</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-800 mr-1">{av.floorEggs.toLocaleString()}</span>
                                <span className="text-gray-400 text-[10px]">({av.totalEggs > 0 ? ((av.floorEggs/av.totalEggs)*100).toFixed(1) : '0.0'}%)</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Mortality */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                     <span className="text-xs text-gray-500">Mortalidade Total:</span>
                     <span className="text-xs font-bold text-red-600">{av.totalMortality}</span>
                </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 p-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50">
             Nenhum dado encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               Produção por Mês <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Comparativo</span>
             </h3>
             <div className="h-64 w-full">
                {renderLineChart()}
             </div>
             <div className="flex justify-center gap-6 mt-4">
                {['1','2','3','4'].map(id => (
                    <div key={id} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <div className={`w-3 h-3 rounded-full ${aviaryColors[id].bg} shadow-sm`}></div>
                        Aviário {id}
                    </div>
                ))}
             </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               Taxa de Postura Média <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Filtrado</span>
             </h3>
             <div className="h-64 w-full flex items-end justify-around px-4 border-b border-gray-100 relative">
                {/* Grid lines background */}
                {[0, 25, 50, 75, 100].map(val => (
                     <div key={val} className="absolute w-full border-t border-gray-100 border-dashed left-0" style={{ bottom: `${val}%` }}>
                        <span className="text-[10px] text-gray-400 absolute -left-8 -top-2 font-medium">{val}</span>
                     </div>
                ))}

                {stats.length > 0 ? stats.map(av => (
                    <div 
                        key={av.id} 
                        className="flex flex-col items-center z-10 w-16 relative cursor-pointer group"
                        onMouseEnter={() => setHoveredBar(av.id)}
                        onMouseLeave={() => setHoveredBar(null)}
                    >
                         {/* Tooltip for Bar Chart */}
                         {hoveredBar === av.id && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs z-20 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="font-bold text-center mb-0.5 text-gray-300">Aviário {av.id}</div>
                                <div className="font-bold text-lg leading-none">
                                    {av.avgLayingRate.toFixed(1)}%
                                </div>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                         )}

                         <div 
                            className={`w-12 rounded-t-lg transition-all duration-700 bg-gradient-to-b ${aviaryColors[av.id].gradientFrom} ${aviaryColors[av.id].gradientTo} shadow-md hover:shadow-lg group-hover:scale-[1.02]`}
                            style={{ height: `${Math.min(av.avgLayingRate, 100) * 2}px` }} // scale factor
                         ></div>
                         <span className="text-xs text-gray-500 mt-3 font-medium bg-gray-50 px-2 py-1 rounded">Av. {av.id}</span>
                    </div>
                )) : (
                  <div className="w-full text-center text-gray-400 text-xs py-20 italic">Sem dados disponíveis</div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

interface AviaryDashboardProps {
  records: ProductionRecord[];
}
