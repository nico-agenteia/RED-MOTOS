/**
 * Migración aditiva: crea la tabla `ventas` (CRM de postventa) en el proyecto
 * de Red Motos. Idempotente. Correr desde la raíz:  npx tsx scripts/migrar-ventas.ts
 */
import pg from "pg";

const CONNECTION_STRING =
  "postgresql://postgres.hnikmutilklpzcvwpbsp:redmotos2026@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

const DDL = `
create table if not exists ventas (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  whatsapp        text not null,
  email           text,
  marca           text,
  modelo          text,
  patente         text,
  fecha_compra    date not null,
  vendedor        text,
  notas           text,
  hito_1m         boolean default false,
  hito_4m         boolean default false,
  hito_8m         boolean default false,
  hito_12m        boolean default false,
  creado_en       timestamptz default now(),
  actualizado_en  timestamptz default now()
);

create index if not exists ventas_fecha on ventas (fecha_compra);

drop trigger if exists ventas_actualizado_en on ventas;
create trigger ventas_actualizado_en
  before update on ventas
  for each row execute function set_actualizado_en();
`;

async function main() {
  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("✅ Conectado a Supabase (Red Motos)\n");
  await client.query(DDL);
  console.log("✅ Tabla `ventas` lista (creada o ya existía).");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
