/**
 * Migración aditiva: crea la tabla `citas` (módulo de Servicios) en el proyecto
 * de Red Motos. Idempotente. Correr desde la raíz:  npx tsx scripts/migrar-citas.ts
 *
 * Se aplica por separado (y no vía run-schema.ts) porque ese script re-ejecuta
 * todo el schema y falla con los triggers ya existentes ("already exists").
 */
import pg from "pg";

const CONNECTION_STRING =
  "postgresql://postgres.hnikmutilklpzcvwpbsp:redmotos2026@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

const DDL = `
create table if not exists citas (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null,
  nombre          text not null,
  whatsapp        text not null,
  email           text,
  marca           text,
  modelo          text,
  descripcion     text,
  precio_estimado int,
  fecha           date,
  hora            text,
  estado          text not null default 'pendiente',
  lead_id         uuid,
  atendido        boolean default false,
  creado_en       timestamptz default now(),
  actualizado_en  timestamptz default now()
);

create unique index if not exists citas_slot_unico on citas (fecha, hora)
  where fecha is not null and estado <> 'cancelada';
create index if not exists citas_estado on citas (estado, creado_en desc);

drop trigger if exists citas_actualizado_en on citas;
create trigger citas_actualizado_en
  before update on citas
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
  console.log("✅ Tabla `citas` lista (creada o ya existía).");

  await client.end();
}

main().catch((err) => {
  console.error("❌ Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
