import { runAllSuites } from './testRunner';

// Importar suites de pruebas unitarias
import './battleManager.test';
import './saveManager.test';
import './questManager.test';
import './audioManager.test';
import './evolutionEngine.test';
import './storyManager.test';
import './abilitiesAndItems.test';
import './fieldMechanics.test';
import './narrativeExpansion.test';
import './logicAudit.test';

/**
 * Punto de entrada principal para ejecutar toda la suite de pruebas unitarias de Pokémon: Ecos de Andara.
 */
async function main() {
  const stats = await runAllSuites();
  if (stats.failed > 0) {
    console.error(`🚨 Fallaron ${stats.failed} prueba(s). Revise los errores listados arriba.`);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  } else {
    console.log(`🎉 ¡Todas las ${stats.total} pruebas unitarias pasaron con éxito!`);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(0);
    }
  }
}

main();
