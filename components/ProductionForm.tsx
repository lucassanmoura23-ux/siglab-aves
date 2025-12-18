
import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { ProductionFormData, ProductionMetrics, ProductionRecord, BatchRecord } from '../types';

interface ProductionFormProps {
  initialData?: ProductionRecord | null;
  batchRecords: BatchRecord[];
  onSave: (record: ProductionRecord) => void;
  onCancel: () => void;
}

export const ProductionForm: React.FC<ProductionFormProps> = ({ 
  initialData, 
  batchRecords, 
  onSave, 
  onCancel 
}) => {
  const today = new Date().toISOString().split('T')[0];

  const defaultValues: ProductionFormData = {
    date: today,
    aviaryId: '1',
    batchId: '',
    liveBirds: 0,
    cleanEggs: 0,
    dirtyEggs: 0,
    crackedEggs: 0,
    floorEggs: 0,
    eggWeightAvg: 0,
    birdWeightAvg: 0,
    mortality: 0,
    notes: ''
  };

  const [formData, setFormData] = useState<ProductionFormData>(() => {
    if (initialData) {
      return {
        date: initialData.date,
        aviaryId: initialData.aviaryId,
        batchId: initialData.batchId,
        liveBirds: initialData.liveBirds,
        cleanEggs: initialData.cleanEggs,
        dirtyEggs: initialData.dirtyEggs,
        crackedEggs: initialData.crackedEggs,
        floorEggs: initialData.floorEggs,
        eggWeightAvg: initialData.eggWeightAvg,
        birdWeightAvg: initialData.birdWeightAvg,
        mortality: initialData.mortality,
        notes: initialData.notes
      };
    }
    return defaultValues;
  });

  useEffect(() => {
    if (initialData) return;
    const selectedDate = new Date(formData.date);
    const activeBatch = batchRecords
      .filter(b => b.aviaryId === formData.aviaryId)
      .filter(b => new Date(b.date) <= selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    setFormData(prev => ({
      ...prev,
      batchId: activeBatch ? activeBatch.batchId : 'N/D'
    }));
  }, [formData.date, formData.aviaryId, batchRecords, initialData]);

  const hasFloorEggs = ['2', '4'].includes(formData.aviaryId);

  const metrics: ProductionMetrics = useMemo(() => {
    const clean = Number(formData.cleanEggs) || 0;
    const dirty = Number(formData.dirtyEggs) || 0;
    const cracked = Number(formData.crackedEggs) || 0;
    const floor = hasFloorEggs ? (Number(formData.floorEggs) || 0) : 0;
    const birds = Number(formData.liveBirds) || 0;

    const totalEggs = clean + dirty + cracked + floor;
    
    const calculatePercentage = (val: number, total: number) => 
      total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';

    const layingRate = birds > 0 ? ((totalEggs / birds) * 100).toFixed(1) : '0.0';

    return {
      totalEggs,
      cleanPercentage: Number(calculatePercentage(clean, totalEggs)),
      dirtyPercentage: Number(calculatePercentage(dirty, totalEggs)),
      crackedPercentage: Number(calculatePercentage(cracked, totalEggs)),
      floorPercentage: Number(calculatePercentage(floor, totalEggs)),
      layingRate: Number(layingRate)
    };
  }, [formData.cleanEggs, formData.dirtyEggs, formData.crackedEggs, formData.floorEggs, formData.liveBirds, hasFloorEggs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (name === 'aviaryId') {
          if (!['2', '4'].includes(value)) newData.floorEggs = 0;
        }
        return newData;
      });
    }
  };

  const handleSubmit = () => {
    if (metrics.totalEggs === 0 && formData.liveBirds === 0) {
      alert("Por favor, preencha os dados de produção.");
      return;
    }
    if (formData.batchId === 'N/D' || !formData.batchId) {
        alert("Bloqueio de Sistema:\n\nCadastre o lote antes de lançar a produção.");
        return;
    }
    const record: ProductionRecord = {
      ...formData,
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      metrics: metrics
    };
    onSave(record);
  };

  const isBatchMissing = formData.batchId === 'N/D';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 md:px-8 py-4 md:py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          {initialData ? 'Editar Registro' : 'Lançar Produção'}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {isBatchMissing && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-600 font-bold">Lote não encontrado para este aviário na data selecionada.</p>
          </div>
        )}

        <section className={`space-y-4 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-blue-700 font-black text-xs md:text-sm uppercase tracking-widest border-l-4 border-blue-600 pl-3">1. Identificação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="space-y-1.5 pointer-events-auto">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1.5 pointer-events-auto">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Aviário</label>
              <select name="aviaryId" value={formData.aviaryId} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="1">Aviário 1</option><option value="2">Aviário 2</option><option value="3">Aviário 3</option><option value="4">Aviário 4</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Lote Ativo</label>
              <div className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-black text-gray-600 flex items-center justify-between">
                {formData.batchId || 'Buscando...'} <LinkIcon size={14} className="text-gray-300" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Aves Vivas</label>
              <input type="number" name="liveBirds" value={formData.liveBirds || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </section>

        <section className={`space-y-4 pt-4 border-t border-gray-50 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-emerald-600 font-black text-xs md:text-sm uppercase tracking-widest border-l-4 border-emerald-600 pl-3">2. Produção do Dia</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest">Limpos</label>
                <input type="number" name="cleanEggs" value={formData.cleanEggs || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest">Sujos</label>
                <input type="number" name="dirtyEggs" value={formData.dirtyEggs || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-orange-50/50 border border-orange-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest">Trincados</label>
                <input type="number" name="crackedEggs" value={formData.crackedEggs || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-red-50/50 border border-red-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              {hasFloorEggs && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-yellow-600 uppercase tracking-widest">Cama</label>
                  <input type="number" name="floorEggs" value={formData.floorEggs || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-yellow-50/50 border border-yellow-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
              )}
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 text-center text-white shadow-xl shadow-slate-200 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Total Coletado</span>
            <span className="text-4xl font-black">{metrics.totalEggs.toLocaleString()}</span>
            <span className="text-xs font-bold text-blue-400 mt-2">Taxa de Postura: {metrics.layingRate}%</span>
          </div>
        </section>

        <section className={`space-y-4 pt-4 border-t border-gray-50 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-indigo-600 font-black text-xs md:text-sm uppercase tracking-widest border-l-4 border-indigo-600 pl-3">3. Manejo e Notas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Peso Ovos (g)</label>
              <input type="number" name="eggWeightAvg" value={formData.eggWeightAvg || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
             <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Peso Aves (g)</label>
              <input type="number" name="birdWeightAvg" value={formData.birdWeightAvg || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
             <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-red-500 uppercase tracking-widest">Mortalidade</label>
              <input type="number" name="mortality" value={formData.mortality || ''} onChange={handleChange} className="w-full px-3 py-2.5 bg-red-50/30 border border-red-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div className="space-y-1.5 pt-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações de Manejo</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Digite aqui ocorrências relevantes..." />
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
          <button onClick={onCancel} className="w-full sm:flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors order-2 sm:order-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={isBatchMissing} className={`w-full sm:flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex justify-center items-center gap-2 order-1 sm:order-2 ${isBatchMissing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}>
            <Save size={18} /> {initialData ? 'Atualizar' : 'Salvar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
};
