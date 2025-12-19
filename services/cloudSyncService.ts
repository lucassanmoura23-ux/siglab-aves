
/**
 * Serviço de Sincronização em Nuvem SIGLAB
 * Utiliza o kvdb.io para persistência remota baseada em chaves.
 */

const BUCKET_ID = 'siglab_aviario_prod_sync_v2'; 
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

export interface CloudData {
  records: any[];
  batchRecords: any[];
  updatedAt: string;
}

export const pushToCloud = async (key: string, data: Omit<CloudData, 'updatedAt'>): Promise<boolean> => {
  if (!key || key.length < 4) return false;
  
  // Limpar a chave para evitar caracteres inválidos na URL
  const sanitizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  try {
    const payload: CloudData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`${BASE_URL}/${sanitizedKey}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar dados para nuvem:", error);
    return false;
  }
};

export const fetchFromCloud = async (key: string): Promise<CloudData | null> => {
  if (!key || key.length < 4) return null;
  
  const sanitizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  try {
    const response = await fetch(`${BASE_URL}/${sanitizedKey}`);
    
    if (response.status === 404) return null; // Ainda não existem dados para esta chave
    
    if (!response.ok) throw new Error("Falha na rede");
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados da nuvem:", error);
    return null;
  }
};
