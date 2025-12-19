
/**
 * Serviço de Sincronização em Nuvem SIGLAB v5 (Estável)
 * Canal de alta disponibilidade para sincronização entre Celular e PC.
 */

// Bucket exclusivo para a produção do SIGLAB
const BUCKET_ID = 'siglab_agronegocio_v5'; 
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

export interface CloudData {
  records: any[];
  batchRecords: any[];
  updatedAt: string;
}

export const pushToCloud = async (key: string, data: Omit<CloudData, 'updatedAt'>): Promise<boolean> => {
  if (!key || key.length < 2) return false;
  
  // Limpa a chave para garantir que a URL seja válida
  const sanitizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');

  try {
    const payload: CloudData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Tentativa de envio com tempo de espera (timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de limite

    const response = await fetch(`${BASE_URL}/${sanitizedKey}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Erro crítico ao salvar na nuvem:", error);
    return false;
  }
};

export const fetchFromCloud = async (key: string): Promise<CloudData | null> => {
  if (!key || key.length < 2) return null;
  
  const sanitizedKey = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');

  try {
    const response = await fetch(`${BASE_URL}/${sanitizedKey}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store' // Garante que pegue o dado mais novo, não o do cache
    });
    
    if (response.status === 404) {
      console.log("Nenhum dado encontrado para esta chave.");
      return null;
    }
    
    if (!response.ok) throw new Error("Erro na resposta do servidor");
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar da nuvem:", error);
    return null;
  }
};
