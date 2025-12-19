
export interface ProductionMetrics {
  totalEggs: number;
  cleanPercentage: number;
  dirtyPercentage: number;
  crackedPercentage: number;
  floorPercentage: number;
  layingRate: number;
}

export interface ProductionFormData {
  date: string;
  aviaryId: string;
  batchId: string;
  liveBirds: number;
  cleanEggs: number;
  dirtyEggs: number;
  crackedEggs: number;
  floorEggs: number;
  eggWeightAvg: number;
  birdWeightAvg: number;
  mortality: number;
  notes: string;
}

export interface ProductionRecord extends ProductionFormData {
  id: string;
  createdAt: string;
  updatedAt: string; // Adicionado para controle de sync
  metrics: ProductionMetrics;
}

export interface BatchRecord {
  id: string;
  date: string;
  aviaryId: string;
  batchId: string;
  ageWeeks: number;
  currentBirds: number;
  weight: number;
  uniformity: number;
  feathering: 'Excelente' | 'Bom' | 'Regular' | 'Ruim';
  notes?: string;
  updatedAt: string; // Adicionado para controle de sync
}

export type ViewState = 
  | 'dashboard' 
  | 'aviary-details' 
  | 'daily-records' 
  | 'new-production' 
  | 'batch-characteristics' 
  | 'new-batch-characterization'
  | 'ai-reports';
