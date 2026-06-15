/**
 * Ejecuta el schema SQL en Supabase vía conexión directa a PostgreSQL.
 * Correr desde la raíz del proyecto:  npx tsx scripts/run-schema.ts
 */
import pg from "pg";
import { readFileSync } from "fs";
import { join } from "path";

// Supabase connection pooler (Transaction mode, puerto 6543 para DDL o 5432)
const CONNECTION_STRING =
  "postgresql://postgres.hnikmutilklpzcvwpbsp:redmotos2026@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("✅ Conectado a Supabase PostgreSQL\n");

  const sql = readFileSync(join(process.cwd(), "docs", "schema.sql"), "utf-8");

  // Ejecutar todo el SQL como un único bloque (respeta $$...$$)
  try {
    await client.query(sql);
    console.log("✅ Schema aplicado correctamente.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      console.log("⏭️  Tablas ya existían — sin cambios.");
    } else {
      console.error("❌ Error:", msg);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\n🎉 Schema listo. Próximo paso: crear los buckets en Supabase Storage.");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
