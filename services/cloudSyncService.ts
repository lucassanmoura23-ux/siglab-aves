
/**
 * Serviço de Sincronização em Nuvem SIGLAB v3
 * Utiliza um canal de dados otimizado para sincronização multiplataforma.
 */

// Usamos um bucket fixo para a aplicação e chaves dinâmicas para cada usuário
const BUCKET_ID = 'siglab_aviario_cloud_v3'; 
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

export interface CloudData {
  records: any[];
  batchRecords: any[];
  updatedAt: string;
}

export const pushToCloud = async (key: string, data: Omit<CloudData, 'updatedAt'>): Promise<boolean> => {
  if (!key || key.length < 2) return false;
  
  // Normaliza a chave para evitar problemas de URL
  const sanitizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');

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
    console.error("Erro ao salvar na nuvem:", error);
    return false;
  }
};

export const fetchFromCloud = async (key: string): Promise<CloudData | null> => {
  if (!key || key.length < 2) return null;
  
  const sanitizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');

  try {
    const response = await fetch(`${BASE_URL}/${sanitizedKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Falha na rede");
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar da nuvem:", error);
    return null;
  }
};
