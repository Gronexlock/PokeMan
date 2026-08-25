/**
 * Script de Sincronización Automática de Assets para Pokémon: Ecos de Andara
 * Descarga sprites animados (frente y espalda) y Official Artwork para todos los iniciales (Gen 1 - Gen 9)
 * Uso: node tools/sync_assets.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

const artworkDir = path.join(rootDir, 'public', 'assets', 'sprites', 'artwork');
const frontSpritesDir = path.join(rootDir, 'public', 'assets', 'sprites', 'battle', 'animated');
const backSpritesDir = path.join(rootDir, 'public', 'assets', 'sprites', 'battle', 'back');

fs.mkdirSync(artworkDir, { recursive: true });
fs.mkdirSync(frontSpritesDir, { recursive: true });
fs.mkdirSync(backSpritesDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    try {
      if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
        resolve({ success: true, cached: true });
        return;
      }
    } catch (e) {
      // Ignorar y proceder a descargar
    }

    const file = fs.createWriteStream(dest);
    const request = https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ success: true });
        });
      } else {
        file.close();
        fs.unlink(dest, () => {});
        resolve({ success: false, statusCode: response.statusCode });
      }
    });

    request.on('error', () => {
      file.close();
      fs.unlink(dest, () => {});
      resolve({ success: false });
    });

    request.setTimeout(10000, () => {
      request.destroy();
      file.close();
      fs.unlink(dest, () => {});
      resolve({ success: false, timeout: true });
    });
  });
}

// 27 Iniciales de todas las generaciones
const STARTERS = [
  // Gen 1
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 7, name: 'squirtle' },
  // Gen 2
  { id: 152, name: 'chikorita' },
  { id: 155, name: 'cyndaquil' },
  { id: 158, name: 'totodile' },
  // Gen 3
  { id: 252, name: 'treecko' },
  { id: 255, name: 'torchic' },
  { id: 258, name: 'mudkip' },
  // Gen 4
  { id: 387, name: 'turtwig' },
  { id: 390, name: 'chimchar' },
  { id: 393, name: 'piplup' },
  // Gen 5
  { id: 495, name: 'snivy' },
  { id: 498, name: 'tepig' },
  { id: 501, name: 'oshawott' },
  // Gen 6
  { id: 650, name: 'chespin' },
  { id: 653, name: 'fennekin' },
  { id: 656, name: 'froakie' },
  // Gen 7
  { id: 722, name: 'rowlet' },
  { id: 725, name: 'litten' },
  { id: 728, name: 'popplio' },
  // Gen 8
  { id: 810, name: 'grookey' },
  { id: 813, name: 'scorbunny' },
  { id: 816, name: 'sobble' },
  // Gen 9
  { id: 906, name: 'sprigatito' },
  { id: 909, name: 'fuecoco' },
  { id: 912, name: 'quaxly' }
];

async function syncAll() {
  console.log("=========================================================");
  console.log("  SINCRONIZANDO ARTWORK Y SPRITES PARA TODOS LOS INICIALES");
  console.log("=========================================================\n");

  for (const st of STARTERS) {
    console.log(`\n📦 Procesando #${st.id} ${st.name}...`);

    // 1. Official Artwork
    const artDest = path.join(artworkDir, `${st.id}.png`);
    const artUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${st.id}.png`;
    let resArt = await downloadFile(artUrl, artDest);
    console.log(`  - Artwork: ${resArt.success ? (resArt.cached ? 'Caché' : 'Descargado') : 'Fallo'}`);

    // 2. Front Animated GIF (Showdown -> PokeAPI fallback)
    const frontDest = path.join(frontSpritesDir, `${st.id}.gif`);
    const showdownFront = `https://play.pokemonshowdown.com/sprites/gen5ani/${st.name}.gif`;
    const pokeApiFront = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${st.id}.gif`;
    const staticFront = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${st.id}.png`;

    let resFront = await downloadFile(showdownFront, frontDest);
    if (!resFront.success) resFront = await downloadFile(pokeApiFront, frontDest);
    if (!resFront.success) resFront = await downloadFile(staticFront, frontDest);
    console.log(`  - Sprite Frente: ${resFront.success ? (resFront.cached ? 'Caché' : 'Descargado') : 'Fallo'}`);

    // 3. Back Animated GIF (Showdown -> PokeAPI fallback)
    const backDest = path.join(backSpritesDir, `${st.id}.gif`);
    const showdownBack = `https://play.pokemonshowdown.com/sprites/gen5ani-back/${st.name}.gif`;
    const pokeApiBack = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/${st.id}.gif`;
    const staticBack = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${st.id}.png`;

    let resBack = await downloadFile(showdownBack, backDest);
    if (!resBack.success) resBack = await downloadFile(pokeApiBack, backDest);
    if (!resBack.success) resBack = await downloadFile(staticBack, backDest);
    console.log(`  - Sprite Espalda: ${resBack.success ? (resBack.cached ? 'Caché' : 'Descargado') : 'Fallo'}`);
  }

  console.log("\n✨ Sincronización completada.");
}

syncAll();
