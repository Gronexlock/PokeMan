import * as Phaser from 'phaser';
import { MapSignpost, MapItemBall } from './MapManager';
import { DialogueBoxPhaser } from '../ui/DialogueBoxPhaser';

export interface PlayerInventoryItem {
  id: string;
  name: string;
  quantity: number;
}

/**
 * Gestor de Interacciones del Mapa.
 *
 * Responsabilidades:
 * - Detectar el letrero más cercano al jugador y mostrarlo en el DialogueBox.
 * - Renderizar las Poké Balls en el suelo (Item Balls) y gestionar su recogida.
 * - Actualizar el inventario del jugador al recoger un objeto.
 */
export class InteractionManager {
  private scene: Phaser.Scene;
  private dialogueBox: DialogueBoxPhaser;

  // Sprites vivos de las Item Balls en el mapa (se eliminan al recogerse)
  private itemBallSprites: Map<string, Phaser.GameObjects.Container> = new Map();

  // Inventario simple del jugador (se sincronizará con SaveManager en la Fase 4)
  public playerInventory: PlayerInventoryItem[] = [];

  // Estado de items recogidos (persiste entre re-cargas de mapa via SaveManager)
  private collectedItemIds: Set<string> = new Set();

  constructor(scene: Phaser.Scene, dialogueBox: DialogueBoxPhaser) {
    this.scene = scene;
    this.dialogueBox = dialogueBox;
  }

  // ─────────────────────────────────────────────────────────────────
  // SECCIÓN 1: LETREROS INTERACTIVOS (SIGNPOSTS)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Busca el letrero más cercano dentro del radio de interacción.
   * Llamar cuando el jugador presione la tecla de acción (Espacio / Z / Enter).
   *
   * @param playerX - Posición X del jugador en píxeles.
   * @param playerY - Posición Y del jugador en píxeles.
   * @param signposts - Lista de letreros del mapa actual.
   * @param maxDistance - Radio de interacción en píxeles (default: 40).
   * @returns `true` si se inició un diálogo de letrero.
   */
  public tryInteractWithSignpost(
    playerX: number,
    playerY: number,
    signposts: MapSignpost[],
    maxDistance: number = 40
  ): boolean {
    if (this.dialogueBox.isDialogueActive()) return false;

    const sign = this.findNearest(playerX, playerY, signposts, maxDistance);
    if (!sign) return false;

    this.displaySignpost(sign);
    return true;
  }

  /**
   * Muestra el contenido del letrero en el cuadro de diálogo letter por letra.
   * El título aparece en la etiqueta del hablante y el texto en el cuerpo.
   */
  private displaySignpost(sign: MapSignpost): void {
    // Separamos el texto en frases si tiene múltiples oraciones largas
    const sentences = this.splitIntoSentences(sign.text);
    this.dialogueBox.startDialogue(`📋 ${sign.title}`, sentences);
  }

  // ─────────────────────────────────────────────────────────────────
  // SECCIÓN 2: OBJETOS EN EL SUELO (ITEM BALLS)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Instancia en pantalla todas las Poké Balls (Item Balls) del mapa.
   * Las que ya fueron recogidas en sesiones anteriores se omiten.
   *
   * @param itemBalls - Lista de item balls del mapa actual.
   * @param collectedIds - IDs de items ya recogidos (del save).
   */
  public spawnItemBalls(itemBalls: MapItemBall[], collectedIds: string[] = []): void {
    // Registrar los ya recogidos
    collectedIds.forEach(id => this.collectedItemIds.add(id));

    itemBalls.forEach(item => {
      if (this.collectedItemIds.has(item.id)) return; // Ya recogido, no lo mostramos

      this.spawnSingleItemBall(item);
    });
  }

  /**
   * Crea el sprite de una Poké Ball en el suelo con su animación de flotación.
   */
  private spawnSingleItemBall(item: MapItemBall): void {
    const container = this.scene.add.container(item.x, item.y);
    container.setDepth(5);

    // Sombra elíptica en el suelo
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, 10, 20, 8);
    container.add(shadow);

    // Sprite de Poké Ball (placeholder gráfico si no hay textura cargada)
    let ballVisual: Phaser.GameObjects.GameObject;

    if (this.scene.textures.exists('item_ball')) {
      ballVisual = this.scene.add.image(0, 0, 'item_ball');
    } else {
      // Placeholder: círculo rojo/blanco estilizado
      const g = this.scene.add.graphics();
      g.fillStyle(0xe74c3c, 1);
      g.fillCircle(0, 0, 9);
      g.fillStyle(0xffffff, 1);
      g.fillRect(-9, -1, 18, 10);
      g.lineStyle(2, 0x2c3e50, 1);
      g.strokeCircle(0, 0, 9);
      g.strokeRect(-9, -1, 18, 1);
      ballVisual = g;
    }

    container.add(ballVisual as Phaser.GameObjects.Graphics);

    // Animación de flotación suave (Bob up/down en loop)
    this.scene.tweens.add({
      targets: container,
      y: item.y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Ícono de ¡! cuando el jugador está cerca (se activa en checkItemBallPickup)
    const exclamation = this.scene.add.text(0, -20, '!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f1c40f'
    }).setOrigin(0.5).setVisible(false);
    container.add(exclamation);

    // Guardar referencia + metadata en el container para recuperarla al interactuar
    (container as any).__itemData = item;
    (container as any).__exclamation = exclamation;

    this.itemBallSprites.set(item.id, container);
  }

  /**
   * Comprueba si el jugador está suficientemente cerca de una Item Ball para recogerla.
   * Llamar cuando el jugador presione la tecla de acción.
   *
   * @param playerX - Posición X del jugador.
   * @param playerY - Posición Y del jugador.
   * @param onPickup - Callback con nombre del objeto recogido para mostrarlo en diálogo.
   * @returns `true` si se recogió un objeto.
   */
  public tryPickupItemBall(
    playerX: number,
    playerY: number,
    onPickup?: (itemName: string, quantity: number) => void
  ): boolean {
    if (this.dialogueBox.isDialogueActive()) return false;

    const PICKUP_RADIUS = 36;
    let closestId: string | null = null;
    let closestDist = Infinity;

    // Encontrar la Item Ball más cercana dentro del radio
    this.itemBallSprites.forEach((container, id) => {
      const dist = Phaser.Math.Distance.Between(playerX, playerY, container.x, container.y);
      if (dist <= PICKUP_RADIUS && dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    });

    if (!closestId) return false;

    const container = this.itemBallSprites.get(closestId)!;
    const itemData = (container as any).__itemData as MapItemBall;

    this.collectItemBall(closestId, itemData, container, onPickup);
    return true;
  }

  /**
   * Efectúa la recogida: agrega al inventario, muestra mensaje y destruye el sprite.
   */
  private collectItemBall(
    id: string,
    item: MapItemBall,
    container: Phaser.GameObjects.Container,
    onPickup?: (itemName: string, quantity: number) => void
  ): void {
    // 1. Registrar como recogido
    this.collectedItemIds.add(id);

    // 2. Agregar al inventario del jugador
    this.addToInventory(item.itemId, item.itemName, item.quantity);

    // 3. Animación de recolección: escala hacia arriba y desvanece
    this.scene.tweens.add({
      targets: container,
      y: container.y - 20,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        container.destroy();
        this.itemBallSprites.delete(id);
      }
    });

    // 4. Callback + diálogo de confirmación
    if (onPickup) {
      onPickup(item.itemName, item.quantity);
    } else {
      const quantityStr = item.quantity > 1 ? `x${item.quantity} ` : '';
      this.dialogueBox.startDialogue(
        '📦 Objeto',
        [`¡Encontraste ${quantityStr}${item.itemName}!`]
      );
    }
  }

  /**
   * Actualiza los íconos de exclamación en función de la distancia del jugador.
   * Llamar en el `update()` para el efecto visual de proximidad.
   */
  public updateProximityHints(playerX: number, playerY: number): void {
    const HINT_RADIUS = 50;

    this.itemBallSprites.forEach(container => {
      const exclamation = (container as any).__exclamation as Phaser.GameObjects.Text;
      if (!exclamation) return;

      const dist = Phaser.Math.Distance.Between(playerX, playerY, container.x, container.y);
      exclamation.setVisible(dist <= HINT_RADIUS);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SECCIÓN 3: UTILIDADES
  // ─────────────────────────────────────────────────────────────────

  /**
   * Limpia todos los sprites de Item Balls (al cambiar de mapa).
   */
  public clearItemBalls(): void {
    this.itemBallSprites.forEach(container => container.destroy());
    this.itemBallSprites.clear();
  }

  /**
   * Devuelve los IDs de los objetos ya recogidos (para persistir en el guardado).
   */
  public getCollectedItemIds(): string[] {
    return Array.from(this.collectedItemIds);
  }

  /**
   * Agrega un objeto al inventario del jugador, apilando cantidades.
   */
  private addToInventory(itemId: string, itemName: string, quantity: number): void {
    const existing = this.playerInventory.find(i => i.id === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.playerInventory.push({ id: itemId, name: itemName, quantity });
    }
  }

  /**
   * Encuentra el elemento más cercano en un array de objetos con propiedades x/y.
   */
  private findNearest<T extends { x: number; y: number }>(
    px: number,
    py: number,
    items: T[],
    maxDist: number
  ): T | null {
    let closest: T | null = null;
    let closestDist = maxDist;

    for (const item of items) {
      const dist = Phaser.Math.Distance.Between(px, py, item.x, item.y);
      if (dist <= closestDist) {
        closestDist = dist;
        closest = item;
      }
    }

    return closest;
  }

  /**
   * Divide un texto largo en frases de máximo 80 caracteres para el cuadro de diálogo.
   */
  private splitIntoSentences(text: string, maxLength: number = 80): string[] {
    // Primero intentar dividir por puntos, comas o saltos de línea naturales
    const raw = text.split(/(?<=[.!?])\s+/);
    const result: string[] = [];

    for (const fragment of raw) {
      if (fragment.length <= maxLength) {
        result.push(fragment.trim());
      } else {
        // Si el fragmento es muy largo, dividir en chunks de `maxLength`
        let remaining = fragment.trim();
        while (remaining.length > maxLength) {
          // Buscar el último espacio antes del límite
          const cutAt = remaining.lastIndexOf(' ', maxLength);
          const breakAt = cutAt > 0 ? cutAt : maxLength;
          result.push(remaining.substring(0, breakAt).trim());
          remaining = remaining.substring(breakAt).trim();
        }
        if (remaining.length > 0) {
          result.push(remaining);
        }
      }
    }

    return result.filter(s => s.length > 0);
  }
}
