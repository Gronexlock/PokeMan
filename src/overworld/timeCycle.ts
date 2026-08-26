import { TimePeriod } from '../core/types';

export class TimeCycleManager {
  public gameMinutes: number = 10 * 60; // Inicia a las 10:00 AM (Día brillante)
  public timeMultiplier: number = 1.2;  // 20 minutos reales equivalen a un ciclo completo de 24 horas

  public update(dt: number): void {
    this.gameMinutes = (this.gameMinutes + dt * this.timeMultiplier) % (24 * 60);
  }

  public getTimeString(): string {
    const totalMins = Math.floor(this.gameMinutes);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const hh = hours.toString().padStart(2, '0');
    const mm = mins.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  public getTimePeriod(): TimePeriod {
    const totalMins = Math.floor(this.gameMinutes);
    const hours = totalMins / 60;

    if (hours >= 6 && hours < 12) {
      return 'morning';
    } else if (hours >= 12 && hours < 18) {
      return 'day';
    } else if (hours >= 18 && hours < 21) {
      return 'sunset';
    } else {
      return 'night';
    }
  }

  public setHour(hour: number): void {
    this.gameMinutes = ((hour % 24 + 24) % 24) * 60;
  }
}
