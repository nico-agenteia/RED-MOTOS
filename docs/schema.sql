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

-- ─── Citas de servicio (Reparaciones y Mantenimiento) ────────────────────────
-- Agenda en tiempo real: la disponibilidad se calcula desde el horario menos
-- las citas no canceladas. Mantenimiento agenda un slot; Reparación puede dejar
-- solo datos (fecha/hora null) para que un vendedor cotice.
create table if not exists citas (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null,              -- 'Mantenimiento' | 'Reparación'
  nombre          text not null,
  whatsapp        text not null,
  email           text,
  marca           text,                       -- moto del cliente (desde dropdown)
  modelo          text,
  descripcion     text,                       -- problema (reparación) / notas
  precio_estimado int,                        -- estimado mantención (CLP); null en reparación
  fecha           date,                       -- slot agendado (null = solo dejó datos)
  hora            text,                        -- "10:00"
  estado          text not null default 'pendiente', -- pendiente|confirmada|cancelada|completada
  lead_id         uuid,
  atendido        boolean default false,
  creado_en       timestamptz default now(),
  actualizado_en  timestamptz default now()
);

-- Evita doble reserva del mismo slot (ignora canceladas y citas sin fecha).
create unique index if not exists citas_slot_unico on citas (fecha, hora)
  where fecha is not null and estado <> 'cancelada';
create index if not exists citas_estado on citas (estado, creado_en desc);

drop trigger if exists citas_actualizado_en on citas;
create trigger citas_actualizado_en
  before update on citas
  for each row execute function set_actualizado_en();

-- ─── CRM postventa (seguimiento de mantenciones) ─────────────────────────────
-- El vendedor registra cada venta 0 km. El panel calcula los hitos de mantención
-- (1/4/8/12 meses desde la compra) desde fecha_compra; el de 12m habilita la
-- renovación (moto en parte de pago). Los boolean marcan el hito como hecho.
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
  hito_1m         boolean default false,   -- mantención al mes
  hito_4m         boolean default false,
  hito_8m         boolean default false,
  hito_12m        boolean default false,   -- 12m: opción renovación (parte de pago)
  creado_en       timestamptz default now(),
  actualizado_en  timestamptz default now()
);

create index if not exists ventas_fecha on ventas (fecha_compra);

drop trigger if exists ventas_actualizado_en on ventas;
create trigger ventas_actualizado_en
  before update on ventas
  for each row execute function set_actualizado_en();

-- ─── Clientes felices (entregas co-brandeadas, alimentan "Nuestros Clientes") ──
-- El vendedor sube la foto de la compra; el sitio la compone con el marco de
-- marca (satori+sharp) y la guarda en el bucket `posts`. La web pública lee de
-- aquí (con fallback a las 20 fotos estáticas si no hay registros).
create table if not exists clientes_felices (
  id          uuid primary key default gen_random_uuid(),
  img_url     text not null,             -- imagen compuesta (bucket posts)
  nombre      text,
  marca       text,
  modelo      text,
  orden       int default 0,
  activo      boolean default true,
  creado_en   timestamptz default now()
);

create index if not exists clientes_felices_orden on clientes_felices (activo, orden);

-- ─── Buckets Storage (crear en Supabase → Storage → New bucket) ───────────────
-- catalogo   → Public (imágenes de producto, lee la web)
-- uploads    → Private (fotos crudas del dueño, input de KIE)
-- posts      → Public (piezas para redes)

-- RLS: habilitar en producción según necesidades. Para MVP, service role lo maneja todo.
