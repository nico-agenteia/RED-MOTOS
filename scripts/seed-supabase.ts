/**
 * Seed script — migra los 17 modelos reales a Supabase y sube las imágenes al bucket `catalogo`.
 *
 * Prerequisitos:
 *   1. Crear proyecto Supabase y ejecutar docs/schema.sql
 *   2. Crear buckets en Storage: catalogo (público), uploads (privado), posts (público)
 *   3. Configurar .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   4. Instalar tsx: npm install -D tsx
 *
 * Ejecutar desde la raíz del proyecto web:
 *   npx tsx scripts/seed-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

// Cargar .env.local
config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Catálogo inline (no depende del alias @/) ────────────────────────────────
const CATALOGO = [
  { id: "re-hunter-350", marca: "Royal Enfield", modelo: "Hunter 350", segmento: "Urbana", cc: 350, precio_lista: 3_499_900, precio_bono: null, bono_vence: null, img_local: "/motos/Hunter350.png", usos: ["Ciudad", "Placer"], apta_principiante: true, destacado: true, orden: 0 },
  { id: "re-super-meteor-650-astral", marca: "Royal Enfield", modelo: "Super Meteor 650 Astral", segmento: "Cruiser", cc: 650, precio_lista: 6_799_990, precio_bono: null, bono_vence: null, img_local: "/motos/ASTRALBLUE.png", usos: ["Ruta", "Placer"], apta_principiante: false, destacado: true, orden: 1 },
  { id: "re-super-meteor-650-interestellar", marca: "Royal Enfield", modelo: "Super Meteor 650 Interestellar", segmento: "Cruiser", cc: 650, precio_lista: 6_899_900, precio_bono: null, bono_vence: null, img_local: "/motos/INTERESTELLARGREEN.png", usos: ["Ruta", "Placer"], apta_principiante: false, destacado: false, orden: 2 },
  { id: "re-super-meteor-650-celestial", marca: "Royal Enfield", modelo: "Super Meteor 650 Celestial", segmento: "Cruiser", cc: 650, precio_lista: 6_999_900, precio_bono: null, bono_vence: null, img_local: "/motos/CELESTIALRED.png", usos: ["Ruta", "Placer"], apta_principiante: false, destacado: false, orden: 3 },
  { id: "re-scram-411", marca: "Royal Enfield", modelo: "Scram 411", segmento: "Scrambler", cc: 411, precio_lista: 4_599_900, precio_bono: 4_299_900, bono_vence: null, img_local: "/motos/SCRAM.411.png", usos: ["Ciudad", "Off-road", "Placer"], apta_principiante: true, destacado: true, orden: 4 },
  { id: "re-shotgun-650", marca: "Royal Enfield", modelo: "Shotgun 650", segmento: "Custom", cc: 650, precio_lista: 6_599_990, precio_bono: null, bono_vence: null, img_local: "/motos/SHOTGUN650.png", usos: ["Ciudad", "Placer"], apta_principiante: false, destacado: false, orden: 5 },
  { id: "sz-gixxer-150-fi", marca: "Suzuki", modelo: "Gixxer 150 FI", segmento: "Naked", cc: 150, precio_lista: 2_799_990, precio_bono: null, bono_vence: null, img_local: "/motos/FI150A.png", usos: ["Ciudad", "Trabajo"], apta_principiante: true, destacado: false, orden: 6 },
  { id: "sz-gixxer-150-di", marca: "Suzuki", modelo: "Gixxer 150 DI", segmento: "Naked", cc: 150, precio_lista: 2_499_990, precio_bono: null, bono_vence: null, img_local: "/motos/DI150.png", usos: ["Ciudad", "Trabajo"], apta_principiante: true, destacado: false, orden: 7 },
  { id: "sz-gixxer-250-di", marca: "Suzuki", modelo: "Gixxer 250 DI", segmento: "Deportiva", cc: 250, precio_lista: 3_749_900, precio_bono: null, bono_vence: null, img_local: "/motos/DI250.png", usos: ["Ciudad", "Placer"], apta_principiante: true, destacado: true, orden: 8 },
  { id: "sz-vstrom-250", marca: "Suzuki", modelo: "V-Strom 250", segmento: "Adventure", cc: 250, precio_lista: 4_449_990, precio_bono: null, bono_vence: null, img_local: "/motos/VSTROM250.png", usos: ["Ruta", "Ciudad", "Placer"], apta_principiante: true, destacado: false, orden: 9 },
  { id: "sz-gsx-r-1000r", marca: "Suzuki", modelo: "GSX-R 1000R", segmento: "Deportiva", cc: 1000, precio_lista: 19_999_990, precio_bono: null, bono_vence: null, img_local: "/motos/GSX-R1000R.png", usos: ["Placer", "Ruta"], apta_principiante: false, destacado: false, orden: 10 },
  { id: "ky-xtown-300", marca: "Kymco", modelo: "X-Town 300", segmento: "Scooter", cc: 300, precio_lista: 4_599_990, precio_bono: 3_999_990, bono_vence: null, img_local: "/motos/xtown300.png", usos: ["Ciudad", "Trabajo", "Ruta"], apta_principiante: true, destacado: false, orden: 11 },
  { id: "zt-zt350-t2", marca: "Zontes", modelo: "ZT350-T2", segmento: "Adventure", cc: 350, precio_lista: 4_390_000, precio_bono: null, bono_vence: null, img_local: "/motos/T2.350.png", usos: ["Ruta", "Ciudad", "Placer"], apta_principiante: false, destacado: false, orden: 12 },
  { id: "cy-ra2", marca: "Cyclone", modelo: "RA2", segmento: "Naked", cc: 250, precio_lista: 2_899_900, precio_bono: 2_699_900, bono_vence: null, img_local: "/motos/RA2.png", usos: ["Ciudad", "Trabajo"], apta_principiante: true, destacado: false, orden: 13 },
];

async function subirImagen(localPath: string, id: string): Promise<string> {
  const rutaAbsoluta = join(process.cwd(), "public", localPath);
  if (!existsSync(rutaAbsoluta)) {
    console.warn(`  ⚠️  Imagen no encontrada: ${rutaAbsoluta}. Se usará la ruta /public original.`);
    return localPath;
  }

  const buffer = readFileSync(rutaAbsoluta);
  const extension = localPath.split(".").pop() ?? "png";
  const nombreArchivo = `${id}.${extension}`;

  const { error } = await sb.storage
    .from("catalogo")
    .upload(nombreArchivo, buffer, {
      contentType: `image/${extension === "png" ? "png" : "jpeg"}`,
      upsert: true,
    });

  if (error) {
    console.warn(`  ⚠️  Error subiendo imagen ${nombreArchivo}: ${error.message}`);
    return localPath;
  }

  const { data: urlData } = sb.storage.from("catalogo").getPublicUrl(nombreArchivo);
  return urlData.publicUrl;
}

async function main() {
  console.log("🚀 Iniciando seed de Red Motos → Supabase...\n");

  for (const moto of CATALOGO) {
    console.log(`📸 Subiendo imagen de ${moto.modelo}...`);
    const imgUrl = await subirImagen(moto.img_local, moto.id);

    console.log(`💾 Insertando ${moto.marca} ${moto.modelo}...`);
    const { error } = await sb.from("motos").upsert({
      id: moto.id,
      marca: moto.marca,
      modelo: moto.modelo,
      segmento: moto.segmento,
      cc: moto.cc,
      precio_lista: moto.precio_lista,
      precio_bono: moto.precio_bono,
      bono_vence: moto.bono_vence,
      img: imgUrl,
      usos: moto.usos,
      apta_principiante: moto.apta_principiante,
      destacado: moto.destacado,
      orden: moto.orden,
      activo: true,
    });

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ OK\n`);
    }
  }

  console.log("✅ Seed completado. Verifica en Supabase → Table Editor → motos.");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
