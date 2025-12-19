
/**
 * Serviço de Sincronização em Nuvem para SIGLAB
 * Utiliza o JSONBlob para persistência gratuita e compartilhada entre dispositivos
 */

const BASE_URL = 'https://jsonblob.com/api/jsonBlob';

export const syncService = {
  /**
   * Cria um novo repositório na nuvem e retorna a chave (Sync ID)
   */
  async createCloudStorage(data: any): Promise<string> {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const location = response.headers.get('Location');
      if (location) {
        return location.split('/').pop() || '';
      }
      throw new Error("Falha ao criar armazenamento");
    } catch (error) {
      console.error("Erro ao criar nuvem:", error);
      return '';
    }
  },

  /**
   * Busca os dados da nuvem usando a chave
   */
  async fetchData(syncId: string): Promise<any> {
    if (!syncId) return null;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar dados da nuvem:", error);
      return null;
    }
  },

  /**
   * Atualiza os dados na nuvem
   */
  async updateData(syncId: string, data: any): Promise<boolean> {
    if (!syncId) return false;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (error) {
      console.error("Erro ao atualizar nuvem:", error);
      return false;
    }
  }
};
