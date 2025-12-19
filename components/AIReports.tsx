
import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  Loader2, 
  Download,
  AlertCircle,
  BarChart2,
  Zap,
  FileDown
} from 'lucide-react';
import { ProductionRecord, BatchRecord } from '../types';
import { generateAIReport } from '../services/geminiService';

interface AIReportsProps {
  records: ProductionRecord[];
  batchRecords: BatchRecord[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const AIReports: React.FC<AIReportsProps> = ({ records }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [periodFilter, setPeriodFilter] = useState('Todo o Período');
  const [yearFilter, setYearFilter] = useState('-- Por Ano --');
  const [monthFilter, setMonthFilter] = useState('-- Por Mês --');
  const [fortnightFilter, setFortnightFilter] = useState('-- Por Quinzena --');
  const [aviaryFilter, setAviaryFilter] = useState('Todos Aviários');

  const yearOptions = useMemo(() => {
    const years = (Array.from(new Set(records.map(r => r.date.split('-')[0]))) as string[])
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

    // Ordenação Cronológica (Mês e Ano Reais)
    const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return (yearB * 12 + monthB) - (yearA * 12 + monthA);
    });

    const options: { label: string, value: string }[] = [];
    sortedPeriods.forEach(period => {
      const [year, monthIdx] = period.split('-').map(Number);
      options.push({ label: `${MONTHS_SHORT[monthIdx]}/${year} - 2ª Quinzena`, value: `${year}-${monthIdx}-2` });
      options.push({ label: `${MONTHS_SHORT[monthIdx]}/${year} - 1ª Quinzena`, value: `${year}-${monthIdx}-1` });
    });

    return options;
  }, [records]);

  const filteredData = useMemo(() => {
    return records.filter(record => {
      if (!record.date || !record.date.includes('-')) return false;
      const [rYearStr, rMonthStr, rDayStr] = record.date.split('-');
      const rMonth = parseInt(rMonthStr);
      const rYear = parseInt(rYearStr);
      const rDay = parseInt(rDayStr);
      const today = new Date();

      if (aviaryFilter !== 'Todos Aviários' && record.aviaryId !== aviaryFilter.replace(/\D/g, '')) return false;
      if (yearFilter !== '-- Por Ano --' && rYearStr !== yearFilter) return false;
      if (monthFilter !== '-- Por Mês --' && rMonth !== (MONTHS.indexOf(monthFilter) + 1)) return false;

      if (fortnightFilter !== '-- Por Quinzena --') {
        const [fYear, fMonthIdx, fPart] = fortnightFilter.split('-').map(Number);
        if (rYear !== fYear || (rMonth - 1) !== fMonthIdx) return false;
        if (fPart === 1 && rDay > 15) return false;
        if (fPart === 2 && rDay <= 15) return false;
      }

      if (periodFilter === 'Mês Atual') {
        if (rMonth !== (today.getMonth() + 1) || rYear !== today.getFullYear()) return false;
      }

      return true;
    });
  }, [records, periodFilter, yearFilter, monthFilter, fortnightFilter, aviaryFilter]);

  const handleGenerate = async () => {
    if (filteredData.length === 0) {
      alert("Não há dados registrados para os filtros selecionados.");
      return;
    }
    setIsGenerating(true);
    setReport(null);
    const result = await generateAIReport({
      records: filteredData.map(r => ({
        data: r.date,
        aviario: r.aviaryId,
        ovos: r.metrics.totalEggs,
        postura: r.metrics.layingRate + '%',
        mortes: r.mortality,
        notas: r.notes || "Nenhuma observação registrada"
      })),
      filters: { periodFilter, yearFilter, monthFilter, fortnightFilter, aviaryFilter }
    });
    setReport(result);
    setIsGenerating(false);
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resumo_IA_SIGLAB_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current || !report) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Relatorio_Tecnico_SIGLAB_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  const clearFilters = () => {
    setPeriodFilter('Todo o Período');
    setYearFilter('-- Por Ano --');
    setMonthFilter('-- Por Mês --');
    setFortnightFilter('-- Por Quinzena --');
    setAviaryFilter('Todos Aviários');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4"><div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Zap size={28} /></div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Análise Expressa IA</h2>
            <p className="text-sm text-gray-500 font-medium">Insights rápidos baseados em produção e observações de manejo.</p>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={isGenerating} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isGenerating ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'}`}>
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {isGenerating ? 'Resumindo...' : 'Gerar Resumo Rápido'}
        </button>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect value={periodFilter} onChange={setPeriodFilter} options={['Todo o Período', 'Mês Atual']} />
          <FilterSelect value={yearFilter} onChange={setYearFilter} options={yearOptions} />
          <FilterSelect value={monthFilter} onChange={setMonthFilter} options={['-- Por Mês --', ...MONTHS]} />
          <FilterSelect value={fortnightFilter} onChange={setFortnightFilter} options={['-- Por Quinzena --', ...fortnightOptions.map(o => o.value)]} customLabels={fortnightOptions} />
          <FilterSelect value={aviaryFilter} onChange={setAviaryFilter} options={['Todos Aviários', 'Aviário 1', 'Aviário 2', 'Aviário 3', 'Aviário 4']} />
          <button onClick={clearFilters} className="text-[10px] font-black text-blue-600 uppercase hover:underline ml-2">Limpar</button>
          <div className="ml-auto text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-2"><BarChart2 size={14} /> {filteredData.length} DIAS ANALISADOS</div>
        </div>
      </div>
      <div className="min-h-[300px]">
        {isGenerating ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-12 h-12 rounded-full border-4 border-amber-50 border-t-amber-500 animate-spin"></div>
             <p className="text-sm font-black text-gray-500 uppercase tracking-widest">IA cruzando dados com observações...</p>
          </div>
        ) : report ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4">
             <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Resumo Técnico Gerado</span>
                <div className="flex items-center gap-4">
                  <button onClick={handleDownloadMarkdown} className="text-amber-600 hover:text-amber-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors"><Download size={14} /> Markdown</button>
                  <button onClick={handleDownloadPDF} className="text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 transition-colors"><FileDown size={14} /> Baixar PDF</button>
                </div>
             </div>
             <div className="p-8 prose prose-amber max-w-none" ref={reportRef}>
                <div className="hidden pdf-only flex justify-between items-center mb-6 border-b pb-4"><h1 className="text-2xl font-black text-gray-900 m-0">SIGLAB AVIÁRIO</h1><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Relatório Técnico</span></div>
                <div className="whitespace-pre-wrap font-medium text-gray-700 leading-relaxed text-sm">{report}</div>
                <div className="hidden pdf-only mt-10 pt-4 border-t text-[10px] text-gray-400 flex justify-between uppercase font-black tracking-widest"><span>Gerado por SIGLAB IA</span><span>{new Date().toLocaleDateString('pt-BR')}</span></div>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center"><Sparkles size={40} className="text-gray-200 mb-4" /><p className="text-gray-400 text-xs font-black uppercase tracking-widest">Clique no botão acima para iniciar a análise rápida</p></div>
        )}
      </div>
      <div className="flex items-start gap-3 p-4 bg-amber-50/30 rounded-xl border border-amber-100"><AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} /><p className="text-[10px] font-bold text-amber-800 leading-tight">O relatório agora prioriza as **Observações** inseridas manualmente para justificar variações de postura e mortalidade.</p></div>
    </div>
  );
};

const FilterSelect = ({ value, onChange, options, customLabels }: { value: string, onChange: (v: string) => void, options: string[], customLabels?: { label: string, value: string }[] }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none bg-gray-50 border border-gray-100 text-[10px] font-black py-2 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer uppercase tracking-tight">
      {options.map(o => { const custom = customLabels?.find(cl => cl.value === o); return <option key={o} value={o}>{custom ? custom.label : o}</option>; })}
    </select>
    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);
