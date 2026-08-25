import { PokemonInstance } from './types';

export interface CatchResult {
  caught: boolean;
  shakes: number;
  critical_capture: boolean;
  message: string;
}

export class CatchCalculator {
  private static BALL_MODIFIERS: Record<string, number> = {
    pokeball: 1.0,
    greatball: 1.5,
    ultraball: 2.0,
    masterball: 255.0,
    duskball: 3.0,
    quickball: 5.0,
    nestball: 2.0,
    netball: 3.5,
    timerball: 2.5
  };

  public static calculateCatch(
    target: PokemonInstance,
    ballId: string = 'pokeball',
    turnNumber: number = 1,
    isNightOrCave: boolean = false,
    baseCatchRate: number = 45
  ): CatchResult {
    const ballKey = ballId.toLowerCase().replace('_', '');
    let ballMod = this.BALL_MODIFIERS[ballKey] || 1.0;

    // Master Ball es 100% garantizada
    if (ballKey === 'masterball') {
      return {
        caught: true,
        shakes: 3,
        critical_capture: false,
        message: `¡${target.species_name} fue atrapado sin ninguna resistencia!`
      };
    }

    // Reglas especiales de Balls
    if (ballKey === 'quickball' && turnNumber === 1) {
      ballMod = 5.0;
    } else if (ballKey === 'quickball') {
      ballMod = 1.0;
    }

    if (ballKey === 'duskball' && isNightOrCave) {
      ballMod = 3.0;
    } else if (ballKey === 'duskball') {
      ballMod = 1.0;
    }

    // Modificador de estado
    let statusMod = 1.0;
    if (target.status === 'sleep' || target.status === 'freeze') {
      statusMod = 2.5;
    } else if (target.status === 'paralysis' || target.status === 'burn' || target.status === 'poison' || target.status === 'badly_poison') {
      statusMod = 1.5;
    }

    // Ratio de captura modificado 'a' (Gen 5+)
    const maxHp = target.max_hp;
    const curHp = target.current_hp;
    const rate = baseCatchRate;

    const a = Math.min(255, Math.floor((((3 * maxHp - 2 * curHp) * rate * ballMod) / (3 * maxHp)) * statusMod));

    if (a >= 255) {
      return {
        caught: true,
        shakes: 3,
        critical_capture: false,
        message: `¡Ya está! ¡${target.species_name} ha sido atrapado!`
      };
    }

    // Chequeo de Captura Crítica: c = floor(a * min(255, seen_species_count / 100))
    const criticalChance = Math.floor(a * 0.1);
    const isCritical = Math.random() * 255 < criticalChance;

    // Valor de sacudida 'b'
    // b = floor(65536 / (255 / a)^0.1875) = floor(65536 / ( (255/a)^0.1875 ))
    const b = Math.floor(65536 * Math.pow(a / 255, 0.75));

    if (isCritical) {
      const shakeCheck = Math.floor(Math.random() * 65536);
      if (shakeCheck < b) {
        return {
          caught: true,
          shakes: 1,
          critical_capture: true,
          message: `¡Captura crítica! ¡${target.species_name} atrapado de inmediato!`
        };
      } else {
        return {
          caught: false,
          shakes: 0,
          critical_capture: true,
          message: `¡La Ball se abrió tras la primera sacudida!`
        };
      }
    }

    // 4 comprobaciones de sacudida estándar
    let shakes = 0;
    for (let i = 0; i < 4; i++) {
      const roll = Math.floor(Math.random() * 65536);
      if (roll < b) {
        shakes++;
      } else {
        break;
      }
    }

    if (shakes >= 4) {
      return {
        caught: true,
        shakes: 3,
        critical_capture: false,
        message: `¡Ya está! ¡${target.species_name} ha sido atrapado!`
      };
    }

    const messages = [
      "¡Oh no! ¡El Pokémon se liberó casi al instante!",
      "¡Vaya! ¡Parecía que se iba a quedar dentro!",
      "¡Qué lástima! ¡Estuvo muy cerca!",
      "¡Casi lo logras! ¡Por muy poco!"
    ];

    return {
      caught: false,
      shakes: Math.min(3, shakes),
      critical_capture: false,
      message: messages[shakes] || messages[0]
    };
  }
}
