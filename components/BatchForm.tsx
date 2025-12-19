
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { BatchRecord } from '../types';

interface BatchFormProps {
  initialData?: BatchRecord | null;
  onSave: (record: BatchRecord) => void;
  onCancel: () => void;
}

export const BatchForm: React.FC<BatchFormProps> = ({ initialData, onSave, onCancel }) => {
  const today = new Date().toISOString().split('T')[0];

  const defaultValues: Omit<BatchRecord, 'id'> = {
    date: today,
    aviaryId: '1',
    batchId: '',
    ageWeeks: 0,
    currentBirds: 0, // Kept in state but not in UI, will rely on Production Records
    weight: 0,
    uniformity: 0,
    feathering: 'Bom',
    notes: '',
    updatedAt: new Date().toISOString()
  };

  const [formData, setFormData] = useState<Omit<BatchRecord, 'id'>>(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      return rest;
    }
    return defaultValues;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.batchId) {
      alert("Por favor, informe o número do lote.");
      return;
    }

    const record: BatchRecord = {
      ...formData,
      id: initialData?.id || crypto.randomUUID(),
    };

    onSave(record);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto mt-8">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
        <h2 className="text-xl font-bold text-gray-900">
          {initialData ? 'Editar Caracterização' : 'Nova Caracterização de Lote'}
        </h2>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Row 1: Data e Aviário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm text-gray-700">Data</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-gray-700">Aviário</label>
            <select
              name="aviaryId"
              value={formData.aviaryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="1">Aviário 1</option>
              <option value="2">Aviário 2</option>
              <option value="3">Aviário 3</option>
              <option value="4">Aviário 4</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Postura de galinhas vermelhas em gaiolas</p>
          </div>
        </div>

        {/* Row 2: Lote e Idade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm text-gray-700">Número do Lote</label>
            <input
              type="text"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              placeholder="Ex: Lote 01/24"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-gray-700">Idade do Lote (Semanas)</label>
            <input
              type="number"
              name="ageWeeks"
              value={formData.ageWeeks || ''}
              onChange={handleChange}
              placeholder="Ex: 25"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Row 3: Peso e Uniformidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm text-gray-700">Peso do Lote (g)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight || ''}
              onChange={handleChange}
              placeholder="Ex: 1550"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-gray-700">Uniformidade (%)</label>
            <input
              type="number"
              name="uniformity"
              value={formData.uniformity || ''}
              onChange={handleChange}
              placeholder="Ex: 90"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Row 4: Empenamento */}
        <div className="space-y-1.5">
           <label className="block text-sm text-gray-700">Empenamento</label>
           <select
              name="feathering"
              value={formData.feathering}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Excelente">Excelente</option>
              <option value="Bom">Bom</option>
              <option value="Regular">Regular</option>
              <option value="Ruim">Ruim</option>
            </select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            Salvar Caracterização
          </button>
        </div>
      </div>
    </div>
  );
};
