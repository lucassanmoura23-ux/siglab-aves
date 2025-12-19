
/**
 * Serviço de Sincronização em Nuvem Real SIGLAB
 * Utiliza o serviço KVDB.io para persistência entre dispositivos via internet.
 */

// Bucket público para o SIGLAB (chave de aplicação)
const BUCKET_ID = 'siglab_aviario_v1_sync'; 
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

export const saveToCloud = async (cloudKey: string, data: { records: any[], batchRecords: any[] }) => {
  if (!cloudKey || cloudKey.length < 3) return false;
  
  const sanitizedKey = cloudKey.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '_');
  
  try {
    const payload = {
      records: data.records,
      batchRecords: data.batchRecords,
      lastUpdated: new Date().toISOString(),
      device: navigator.userAgent.includes('Mobi') ? 'Mobile' : 'Desktop'
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

export const fetchFromCloud = async (cloudKey: string) => {
  if (!cloudKey || cloudKey.length < 3) return null;
  
  const sanitizedKey = cloudKey.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '_');
  
  try {
    const response = await fetch(`${BASE_URL}/${sanitizedKey}`);
    
    if (response.status === 404) {
      return null; // Ainda não existem dados para esta chave
    }
    
    if (!response.ok) throw new Error("Erro na rede");
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar da nuvem:", error);
    return null;
  }
};
