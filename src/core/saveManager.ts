import { SaveData } from './types';

export class SaveManager {
  private prefix = "andara_save_";

  public saveGame(slot: string = "save_slot_1", data: SaveData): boolean {
    try {
      data.slot = slot;
      data.timestamp = new Date().toISOString();
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + slot, serialized);
      return true;
    } catch (e) {
      console.error("Error guardando partida en LocalStorage:", e);
      return false;
    }
  }

  public loadGame(slot: string = "save_slot_1"): SaveData | null {
    try {
      const item = localStorage.getItem(this.prefix + slot);
      if (!item) return null;
      return JSON.parse(item) as SaveData;
    } catch (e) {
      console.error("Error cargando partida:", e);
      return null;
    }
  }

  public deleteGame(slot: string = "save_slot_1"): boolean {
    try {
      localStorage.removeItem(this.prefix + slot);
      return true;
    } catch (e) {
      return false;
    }
  }

  public listSlots(): { slot: string; exists: boolean; player_name?: string; badges?: number; timestamp?: string }[] {
    const slots = ["save_slot_1", "save_slot_2", "save_slot_3"];
    return slots.map(slot => {
      const data = this.loadGame(slot);
      if (data) {
        return {
          slot,
          exists: true,
          player_name: data.player_name,
          badges: data.badges?.length || 0,
          timestamp: data.timestamp
        };
      }
      return { slot, exists: false };
    });
  }

  public exportSaveJson(slot: string = "save_slot_1"): string | null {
    const data = this.loadGame(slot);
    if (!data) return null;
    return JSON.stringify(data, null, 2);
  }

  public importSaveJson(slot: string = "save_slot_1", jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as SaveData;
      if (!data.player_name || !data.party) return false;
      return this.saveGame(slot, data);
    } catch (e) {
      console.error("JSON de guardado no válido:", e);
      return false;
    }
  }
}
