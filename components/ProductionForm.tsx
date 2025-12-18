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
  // Initial date formatted as YYYY-MM-DD for input type="date"
  const today = new Date().toISOString().split('T')[0];

  const defaultValues: ProductionFormData = {
    date: today,
    aviaryId: '1',
    batchId: '', // Default empty, will be auto-filled
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

  // Initialize state with initialData if provided, otherwise default values
  const [formData, setFormData] = useState<ProductionFormData>(() => {
    if (initialData) {
      // We explicitly copy fields to avoid reference issues, although initialData spread is usually fine
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

  // Auto-fetch Batch ID based on Date and Aviary
  useEffect(() => {
    if (initialData) return; // Don't override if editing an existing record

    const selectedDate = new Date(formData.date);
    
    // Find the latest batch for this aviary that started on or before the selected date
    const activeBatch = batchRecords
      .filter(b => b.aviaryId === formData.aviaryId)
      .filter(b => new Date(b.date) <= selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    setFormData(prev => ({
      ...prev,
      batchId: activeBatch ? activeBatch.batchId : 'N/D' // 'N/D' if no batch found
    }));

  }, [formData.date, formData.aviaryId, batchRecords, initialData]);

  // Check if current aviary supports floor eggs (Aviary 2 and 4)
  const hasFloorEggs = ['2', '4'].includes(formData.aviaryId);

  // Calculate metrics automatically whenever form data changes
  const metrics: ProductionMetrics = useMemo(() => {
    const clean = Number(formData.cleanEggs) || 0;
    const dirty = Number(formData.dirtyEggs) || 0;
    const cracked = Number(formData.crackedEggs) || 0;
    // Only count floor eggs if applicable to the aviary
    const floor = hasFloorEggs ? (Number(formData.floorEggs) || 0) : 0;
    const birds = Number(formData.liveBirds) || 0;

    const totalEggs = clean + dirty + cracked + floor;
    
    // Avoid division by zero
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
    
    // Handle number inputs to ensure they don't store NaN
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        
        // Reset floor eggs if switching to an aviary that doesn't support them
        if (name === 'aviaryId') {
          if (!['2', '4'].includes(value)) {
            newData.floorEggs = 0;
          }
        }
        return newData;
      });
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (metrics.totalEggs === 0 && formData.liveBirds === 0) {
      alert("Por favor, preencha os dados de produção.");
      return;
    }

    // STRICT VALIDATION: Block if no batch is found
    if (formData.batchId === 'N/D' || !formData.batchId) {
        alert("Bloqueio de Sistema:\n\nNão é possível salvar este registro pois não foi encontrado nenhum lote ativo para este Aviário nesta Data.\n\nPor favor, vá em 'Caracterização de Lotes' e cadastre o lote antes de lançar a produção.");
        return;
    }

    const record: ProductionRecord = {
      ...formData,
      // If editing, keep original ID and createdAt, otherwise generate new
      id: initialData?.id || crypto.randomUUID(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      metrics: metrics
    };

    onSave(record);
  };

  const isBatchMissing = formData.batchId === 'N/D';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Form Header */}
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-900">
          {initialData ? 'Editar Registro de Produção' : 'Novo Registro de Produção'}
        </h2>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-8 space-y-8">
        
        {/* Warning Banner if Batch Missing */}
        {isBatchMissing && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold text-red-800">Lote não encontrado</h4>
              <p className="text-sm text-red-600 mt-1">
                Não existe caracterização de lote para o <strong>Aviário {formData.aviaryId}</strong> na data selecionada. 
                Você precisa cadastrar o lote no menu "Caracterização Lotes" antes de lançar a produção.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Lot Data */}
        <section className={`space-y-4 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-blue-700 font-semibold text-lg flex items-center">
            1. Dados do Lote
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5 pointer-events-auto">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Data</label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="space-y-1.5 pointer-events-auto">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Aviário</label>
              <select
                name="aviaryId"
                value={formData.aviaryId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              >
                <option value="1">Aviário 1</option>
                <option value="2">Aviário 2</option>
                <option value="3">Aviário 3</option>
                <option value="4">Aviário 4</option>
              </select>
              <p className="text-[10px] text-gray-400 truncate">
                {['1', '3'].includes(formData.aviaryId) ? 'Sistema convencional' : 'Sistema com ovos de cama'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                Lote (Automático) <LinkIcon size={12} className="text-green-600" />
              </label>
              <div className={`px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium flex items-center justify-between ${isBatchMissing ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-700'}`}>
                {formData.batchId || 'Buscando...'}
                {isBatchMissing && <span className="text-[10px] bg-red-100 px-1.5 py-0.5 rounded ml-2">Ausente</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Aves Vivas</label>
              <input
                type="number"
                name="liveBirds"
                value={formData.liveBirds || ''}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Production */}
        <section className={`space-y-4 pt-4 border-t border-gray-50 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-blue-700 font-semibold text-lg">2. Produção do Dia</h3>
          <div className="flex flex-col md:flex-row gap-6 items-end">
            
            {/* Dynamic Grid: 3 columns normally, 4 columns if Floor Eggs are shown */}
            <div className={`grid grid-cols-1 md:grid-cols-${hasFloorEggs ? '4' : '3'} gap-6 flex-1 transition-all`}>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-green-600 uppercase">Ovos Limpos</label>
                <input
                  type="number"
                  name="cleanEggs"
                  value={formData.cleanEggs || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-orange-600 uppercase">Ovos Sujos</label>
                <input
                  type="number"
                  name="dirtyEggs"
                  value={formData.dirtyEggs || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-red-600 uppercase">Ovos Trincados</label>
                <input
                  type="number"
                  name="crackedEggs"
                  value={formData.crackedEggs || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              {/* Conditional Floor Eggs Input */}
              {hasFloorEggs && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-left-4 duration-300">
                  <label className="block text-xs font-semibold text-yellow-600 uppercase">Ovos de Cama</label>
                  <input
                    type="number"
                    name="floorEggs"
                    value={formData.floorEggs || ''}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-yellow-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Total Box */}
            <div className="w-full md:w-48 bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Ovos</span>
              <span className="text-3xl font-bold text-gray-900">{metrics.totalEggs.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Section 3: Indicators */}
        <section className={`space-y-4 pt-4 border-t border-gray-50 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-blue-700 font-semibold text-lg">3. Indicadores (Automático)</h3>
          {/* Responsive Grid: Adjusts columns based on available items */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-xs font-medium text-green-800 uppercase mb-1">Limpos</div>
              <div className="text-2xl font-bold text-green-700">{metrics.cleanPercentage}%</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-xs font-medium text-green-800 uppercase mb-1">Sujos</div>
              <div className="text-2xl font-bold text-green-700">{metrics.dirtyPercentage}%</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-xs font-medium text-green-800 uppercase mb-1">Trincados</div>
              <div className="text-2xl font-bold text-green-700">{metrics.crackedPercentage}%</div>
            </div>
            
            {/* Conditional Floor Eggs Indicator */}
            {hasFloorEggs ? (
               <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 animate-in fade-in zoom-in duration-300">
                <div className="text-xs font-medium text-yellow-800 uppercase mb-1">Cama</div>
                <div className="text-2xl font-bold text-yellow-700">{metrics.floorPercentage}%</div>
              </div>
            ) : (
              // Spacer/Placeholder to keep layout consistent if needed, or just let grid handle it
              // Using hidden on small screens to let grid flow naturally
              <div className="hidden md:block p-4 border border-transparent"></div>
            )}

            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xs font-medium text-red-800 uppercase mb-1">Taxa Postura</div>
              <div className="text-2xl font-bold text-red-700">{metrics.layingRate}%</div>
            </div>
          </div>
        </section>

        {/* Section 4: Management */}
        <section className={`space-y-4 pt-4 border-t border-gray-50 ${isBatchMissing ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-blue-700 font-semibold text-lg">4. Manejo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Peso Ovos (g)</label>
              <input
                type="number"
                name="eggWeightAvg"
                value={formData.eggWeightAvg || ''}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
             <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Peso Aves (g)</label>
              <input
                type="number"
                name="birdWeightAvg"
                value={formData.birdWeightAvg || ''}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
             <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase">Mortalidade</label>
              <input
                type="number"
                name="mortality"
                value={formData.mortality || ''}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">Observação (Facultativo)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Digite aqui ocorrências relevantes (ex: falta de energia, troca de ração, vacinação, clima extremo...)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isBatchMissing}
            title={isBatchMissing ? "Cadastre o lote primeiro" : "Salvar registro"}
            className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              isBatchMissing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
            }`}
          >
            <Save size={18} />
            {initialData ? 'Atualizar Registro' : 'Salvar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
};