/**
 * GESTOR NARRATIVO Y DE CAMPAÑA DE ANDARA (HISTORIA PRINCIPAL Y POSTGAME)
 *
 * Sigue fielmente la arquitectura de HISTORIA_ANDARA.md y POKEDEX_REGIONAL_ANDARA.md:
 * - Arco de Nahuel & su Arcanine.
 * - Conflicto Proyecto Aurora vs Aurora Cero (Dra. Clara vs Alister).
 * - Regla inquebrantable: Legendarios NO capturables (Eternatus, Zygarde).
 * - Emergencia de Isla Resonancia, Pokédex Expandida y Santuario del Equilibrio.
 * - Sistema de Defensa del Título de Campeón y New Game+.
 */

export type StoryChapter =
  | 'CH1_VILLA_TRANQUIMAR'
  | 'CH2_METROPOLIS_SOLSTICIO'
  | 'CH3_GYMS_EARLY'
  | 'CH4_NAHUEL_TRAGEDY'
  | 'CH5_GYMS_LATE'
  | 'CH6_POKEMON_LEAGUE'
  | 'CH7_CRISIS_FALLA_COSMICA'
  | 'CH8_ISLA_RESONANCIA_POSTGAME';

export interface StoryProgress {
  currentChapter: StoryChapter;
  badgesCollected: string[];
  nahuelArcanineInherited: boolean;
  eternatusDefeated: boolean;
  zygardeEmblemObtained: boolean;
  expandedPokedexUnlocked: boolean;
  titleDefenseWins: number;
}

export class StoryManager {
  private progress: StoryProgress;

  constructor(initialProgress?: Partial<StoryProgress>) {
    this.progress = {
      currentChapter: 'CH1_VILLA_TRANQUIMAR',
      badgesCollected: [],
      nahuelArcanineInherited: false,
      eternatusDefeated: false,
      zygardeEmblemObtained: false,
      expandedPokedexUnlocked: false,
      titleDefenseWins: 0,
      ...initialProgress
    };
  }

  /**
   * Valida si un Pokémon legendario puede ser capturado.
   * Regla de diseño fundamental de Andara: Los Legendarios NUNCA son capturables.
   */
  public isSpeciesCatchable(speciesName: string): { catchable: boolean; rejectionMessage?: string } {
    const uncatchables = ['eternatus', 'zygarde', 'mewtwo', 'rayquaza', 'kyogre', 'groudon', 'arceus'];
    const nameLower = speciesName.toLowerCase().trim();

    if (uncatchables.some(u => nameLower.includes(u))) {
      return {
        catchable: false,
        rejectionMessage: '¡La inmensa energía de esta entidad divina rechaza las Poké Balls!'
      };
    }

    return { catchable: true };
  }

  /**
   * Registra la obtención de una medalla de gimnasio y avanza capítulos de la historia.
   */
  public awardBadge(badgeId: string): void {
    if (!this.progress.badgesCollected.includes(badgeId)) {
      this.progress.badgesCollected.push(badgeId);
    }

    const count = this.progress.badgesCollected.length;
    if (count >= 4 && this.progress.currentChapter === 'CH3_GYMS_EARLY') {
      this.progress.currentChapter = 'CH4_NAHUEL_TRAGEDY';
    } else if (count >= 8 && this.progress.currentChapter === 'CH5_GYMS_LATE') {
      this.progress.currentChapter = 'CH6_POKEMON_LEAGUE';
    }
  }

  /**
   * Coronación como Campeón de Andara tras derrotar a Renata en la Liga Pokémon.
   */
  public onLeagueChampionVictory(): void {
    this.progress.currentChapter = 'CH7_CRISIS_FALLA_COSMICA';
  }

  /**
   * Resuelve el clímax cósmico de Eternatus y la intervención de Zygarde 100%.
   * Desencadena la emergencia de Isla Resonancia y la entrega del Arcanine de Nahuel.
   */
  public resolveEternatusCataclysm(): {
    arcanineGiftMessage: string[];
    islandEmergenceMessage: string[];
  } {
    this.progress.eternatusDefeated = true;
    this.progress.nahuelArcanineInherited = true;
    this.progress.expandedPokedexUnlocked = true;
    this.progress.currentChapter = 'CH8_ISLA_RESONANCIA_POSTGAME';

    return {
      arcanineGiftMessage: [
        'Nahuel te mira con serenidad mientras sostiene la Poké Ball de su Arcanine.',
        '"No significa que haya dejado de ser mío...',
        'Significa que quiero que siga viajando... y sé que contigo estará bien."',
        '¡Has recibido al Arcanine de Nahuel! (Lazo de lealtad eterno).'
      ],
      islandEmergenceMessage: [
        '¡Alerta Sismológica y Científica del Profesor Ceibo!',
        'El choque de energías entre Eternatus y Zygarde ha provocado la emergencia de una nueva masa insular en el océano meridional:',
        '¡ISLA RESONANCIA (El Archipiélago del Cataclismo) ha emergido!',
        'El Profesor Ceibo ha actualizado tu Pokédex al modo "Pokédex Expandida de Andara".'
      ]
    };
  }

  /**
   * Concede el Emblema del Equilibrio al vencer a Zygarde 100% en el Santuario Sagrado.
   */
  public onZygardeSanctuaryVictory(): string[] {
    this.progress.zygardeEmblemObtained = true;
    return [
      'Zygarde Forma Completa (100%) emite un destello de luz esmeralda y oro.',
      'Reconoce tu espíritu como el Verdadero Guardián del Equilibrio de Andara.',
      '¡Has obtenido el EMBLEMA DEL EQUILIBRIO!',
      'Zygarde se dispersa pacíficamente en las venas telúricas del planeta para continuar su vigilia eterna.'
    ];
  }

  /**
   * Registra una victoria en la defensa del título de Campeón en el Endgame.
   */
  public recordTitleDefenseWin(): number {
    this.progress.titleDefenseWins++;
    return this.progress.titleDefenseWins;
  }

  public get storyState(): Readonly<StoryProgress> {
    return this.progress;
  }
}
