/**
 * Migración aditiva: crea la tabla `clientes_felices` en el proyecto de Red
 * Motos. Idempotente. Correr desde la raíz:  npx tsx scripts/migrar-clientes-felices.ts
 */
import pg from "pg";

const CONNECTION_STRING =
  "postgresql://postgres.hnikmutilklpzcvwpbsp:redmotos2026@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

const DDL = `
create table if not exists clientes_felices (
  id          uuid primary key default gen_random_uuid(),
  img_url     text not null,
  nombre      text,
  marca       text,
  modelo      text,
  orden       int default 0,
  activo      boolean default true,
  creado_en   timestamptz default now()
);

create index if not exists clientes_felices_orden on clientes_felices (activo, orden);
`;

async function main() {
  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("✅ Conectado a Supabase (Red Motos)\n");
  await client.query(DDL);
  console.log("✅ Tabla `clientes_felices` lista (creada o ya existía).");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
