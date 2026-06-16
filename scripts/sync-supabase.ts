/**
 * Sincroniza Supabase con el catálogo de lib/catalogo.ts (fuente de verdad).
 * - Sube cada imagen local /public/motos/* al bucket "catalogo".
 * - Borra todas las motos y reinserta las 48 con su URL pública de Storage.
 * Correr:  npx tsx scripts/sync-supabase.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { CATALOGO } from "../lib/catalogo";

config({ path: join(process.cwd(), ".env.local") });

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

async function main() {
  // 1. Subir imágenes locales únicas al bucket y mapear path -> URL pública
  const pathsLocales = Array.from(new Set(CATALOGO.map((m) => m.img).filter((p) => p.startsWith("/motos/"))));
  const urlPorPath = new Map<string, string>();

  for (const p of pathsLocales) {
    const nombre = p.replace("/motos/", "");
    const buffer = readFileSync(join(process.cwd(), "public", "motos", nombre));
    const ext = nombre.split(".").pop()?.toLowerCase();
    const contentType = ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    const { error } = await sb.storage.from("catalogo").upload(nombre, buffer, { contentType, upsert: true });
    if (error) { console.error(`✗ upload ${nombre}:`, error.message); process.exit(1); }
    const { data } = sb.storage.from("catalogo").getPublicUrl(nombre);
    urlPorPath.set(p, data.publicUrl);
    console.log(`✓ ${nombre}`);
  }

  // 2. Construir filas (snake_case) con la URL pública
  const filas = CATALOGO.map((m) => ({
    id: m.id,
    marca: m.marca,
    modelo: m.modelo,
    segmento: m.segmento,
    cc: m.cc,
    precio_lista: m.precioLista,
    precio_bono: m.precioBono,
    bono_vence: m.bonoVence,
    img: urlPorPath.get(m.img) ?? m.img,
    usos: m.usos,
    apta_principiante: m.aptaPrincipiante,
    destacado: m.destacado,
    orden: m.orden,
    activo: true,
  }));

  // 3. Borrar todas las motos existentes y reinsertar
  const { error: delErr } = await sb.from("motos").delete().neq("id", "");
  if (delErr) { console.error("✗ delete:", delErr.message); process.exit(1); }
  console.log("\n🗑️  Motos anteriores eliminadas");

  const { error: insErr } = await sb.from("motos").insert(filas);
  if (insErr) { console.error("✗ insert:", insErr.message); process.exit(1); }

  console.log(`\n✅ ${filas.length} modelos sincronizados en Supabase`);
  const marcas = Array.from(new Set(filas.map((f) => f.marca)));
  console.log("Marcas:", marcas.join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
