-- Red Motos — Schema Supabase
-- Ejecutar en Supabase → SQL Editor.
-- Buckets a crear en Storage: catalogo (público), uploads (privado), posts (público).

-- ─── Catálogo (fuente única de motos) ────────────────────────────────────────
create table if not exists motos (
  id              text primary key,           -- slug: "re-super-meteor-650"
  marca           text not null,
  modelo          text not null,
  segmento        text not null,
  cc              int  not null,
  precio_lista    int  not null,              -- CLP
  precio_bono     int,                        -- CLP final con descuento; null = sin bono
  bono_vence      date,                       -- vigencia del bono (null = sin vencimiento)
  img             text not null,              -- URL pública (Storage o /public)
  usos            text[] not null default '{}',
  apta_principiante boolean not null default false,
  destacado       boolean not null default false,   -- aparece en ShowcasePremium
  orden           int  not null default 0,          -- orden manual en catálogo
  sin_stock       boolean not null default false,    -- admin marca sin disponibilidad
  activo          boolean not null default true,    -- false = baja lógica
  creado_en       timestamptz default now(),
  actualizado_en  timestamptz default now()
);

create index if not exists motos_activo_orden on motos (activo, orden);

-- Trigger para actualizar actualizado_en automáticamente
create or replace function set_actualizado_en()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end;
$$;

create trigger motos_actualizado_en
  before update on motos
  for each row execute function set_actualizado_en();

-- ─── Leads capturados ────────────────────────────────────────────────────────
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  origen      text not null,              -- "recomendador" | "simulador" | "contacto"
  nombre      text,
  whatsapp    text,
  presupuesto text,
  uso         text,
  experiencia text,
  urgencia    text,
  score       text,                       -- "hot" | "warm" | "cold"
  payload     jsonb,                      -- datos crudos del form
  atendido    boolean default false,
  creado_en   timestamptz default now()
);

create index if not exists leads_score_creado on leads (score, creado_en desc);
create index if not exists leads_atendido on leads (atendido);

-- ─── Solicitudes de financiamiento Autofin (webhooks Araña) ──────────────────
-- Resultado de inyección + evaluación (§3.3) y seguimiento de estado (§3.4).
-- Privacidad: guardamos SOLO lo necesario para seguimiento; NO renta, situación
-- laboral, tipo de contrato/renta, antigüedad, nacionalidad ni dirección.
create table if not exists solicitudes_autofin (
  id                uuid primary key default gen_random_uuid(),
  id_trinidad       bigint unique,            -- id de la solicitud en Trinidad (Autofin)
  lead_id           uuid,                     -- = CodigoExterno (cruce lógico con leads.id)
  estado_evaluacion text,                     -- Aprobado | Dudoso | Rechazado | En Evaluación
  estado_trinidad   text,                     -- estado de workflow (se actualiza vía §3.4)
  cod_estado        int,
  resolucion        text,
  fecha_cambio_estado text,
  producto          text,
  marca             text,
  modelo            text,
  anio              int,
  estado_vehiculo   text,
  precio            int,                       -- CLP
  pie               int,                       -- CLP
  plazo             int,
  valor_cuota       int,                       -- CLP
  cae               text,
  nombre            text,
  rut               text,
  email             text,
  telefono          text,
  dealer            jsonb,                     -- DatosDealer (códigos/nombres, no PII)
  atendido          boolean default false,
  creado_en         timestamptz default now(),
  actualizado_en    timestamptz default now()
);

create index if not exists solicitudes_autofin_lead on solicitudes_autofin (lead_id);
create index if not exists solicitudes_autofin_estado on solicitudes_autofin (estado_evaluacion, creado_en desc);

drop trigger if exists solicitudes_autofin_actualizado_en on solicitudes_autofin;
create trigger solicitudes_autofin_actualizado_en
  before update on solicitudes_autofin
  for each row execute function set_actualizado_en();

-- ─── Tareas de IA (trazabilidad KIE) ─────────────────────────────────────────
create table if not exists ia_tareas (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,              -- "foto-catalogo" | "foto-redes" | "post"
  task_id     text,                       -- id devuelto por KIE
  estado      text not null default 'pendiente', -- pendiente|procesando|listo|error
  input_url   text,
  output_url  text,
  meta        jsonb,
  creado_en   timestamptz default now()
);

-- ─── Buckets Storage (crear en Supabase → Storage → New bucket) ───────────────
-- catalogo   → Public (imágenes de producto, lee la web)
-- uploads    → Private (fotos crudas del dueño, input de KIE)
-- posts      → Public (piezas para redes)

-- RLS: habilitar en producción según necesidades. Para MVP, service role lo maneja todo.
