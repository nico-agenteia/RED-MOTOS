# 🛠️ Blueprint — Panel de Admin Red Motos

> Documento de planificación. **No se ejecuta en esta sesión.** En una sesión
> nueva, leer este blueprint completo y ejecutar por fases.
> Stack: Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (a integrar)
> · KIE.AI (a conectar). Repo: `clientes/red-motos/web` → `nico-agenteia/RED-MOTOS`.

---

## 0. TL;DR — qué vamos a construir

El panel `/admin` ya existe con UI completa (gate por contraseña, dashboard con
3 secciones). Lo que falta es **hacerlo real**: persistencia, edición, conexión
del sitio público y la IA de fotos. Tres prioridades pedidas por el dueño:

1. **Modificar motos** → falta el endpoint y la UI de **editar** (hoy solo
   agregar/eliminar).
2. **Actualizar catálogo (de verdad)** → hoy los cambios viven en memoria y el
   sitio público ni los lee. Hay que mover el catálogo a **Supabase** y que el
   sitio lea de ahí.
3. **Estudio de Fotos IA (KIE.AI)** → subir foto cruda de una moto → la IA
   devuelve una imagen lista para el catálogo, con el estilo de la página.

Más una lista de **funciones recomendadas** para que sea un panel completo
(sección 6.4).

---

## 1. Estado actual (auditoría — junio 2026)

### Lo que YA existe y sirve ✅
- **Auth**: `lib/auth.ts` — token de sesión derivado de `ADMIN_PASSWORD`
  (SHA-256), cookie `rm_admin_sesion` 7 días. `/api/admin/login` (POST login,
  DELETE logout). `LoginGate.tsx` envuelve el panel. **Sólido, se conserva.**
- **Dashboard**: `components/admin/AdminDashboard.tsx` — sidebar + 3 secciones:
  `Stock`, `Generador de Posts`, `Estudio de Fotos`. Tabla de stock con
  búsqueda, paginación (8/pág), agregar (MotoForm) y eliminar.
- **Estudio de Fotos UI**: `EstudioFotos.tsx` — dropzone, selector de estilo
  (`catalogo` | `redes`), patrón de polling async ya implementado en el cliente.
- **Tipos**: `lib/tipos.ts` — `Moto`, `Marca`, `Segmento`, `Uso`,
  `LeadRecomendador`, `LeadScore`.

### Lo que está ROTO o es stub ❌
- **`/api/motos`**: guarda el stock agregado en un array **en memoria**
  (`stockAgregado`) → se borra en cada cold start de serverless. Sólo tiene
  `GET`, `POST`, `DELETE` (soft). **No hay `PUT` (editar).**
- **El sitio público NO usa el API**: `Catalogo.tsx`, `ShowcasePremium.tsx`,
  `GiroBeneficios.tsx`, las salas, etc. importan el array hardcodeado de
  `lib/catalogo.ts` (17 modelos reales). → Lo que el dueño cambie en el panel
  **nunca llega a la web**.
- **KIE.AI sin conectar**: `/api/procesar-imagen` y `/api/kie-status` son stubs
  (responden 501 / "pendiente de conectar"). Falta `KIE_API_KEY` y toda la
  lógica de llamada/sondeo/guardado. `/api/generar-post` igual.
- **"Guardar al catálogo"** en EstudioFotos es un botón sin acción.

### Conclusión
El esqueleto está bien hecho; el trabajo real es **la capa de datos** (lo que
desbloquea todo) + **editar** + **conectar KIE.AI** + **cablear el sitio
público**.

---

## 2. Objetivos

| # | Objetivo | Prioridad |
|---|----------|-----------|
| O1 | Catálogo persistente y editable, fuente única leída por web y admin | 🔴 Base |
| O2 | CRUD completo de motos (crear, **editar**, eliminar, destacar, reordenar) | 🔴 |
| O3 | Estudio de Fotos IA con KIE.AI: foto cruda → imagen lista para catálogo | 🔴 |
| O4 | Sitio público lee del datastore con revalidación (ISR / on-demand) | 🔴 |
| O5 | Bandeja de leads + métricas (panel "completo") | 🟡 Recomendado |
| O6 | Generador de Posts para redes (captions + imagen) | 🟡 |
| O7 | Gestión de testimonios, sucursales/contacto, media library | 🟢 Nice-to-have |

---

## 3. Decisiones de arquitectura

### 3.1 Persistencia → **Supabase** (recomendado)
Ya hay un `// TODO: conectar a Supabase` en `/api/motos`. Razones: Postgres +
Storage + (opcional) Auth en un solo proveedor, free tier generoso, SDK simple.

- Cliente **solo en el servidor** (API routes / Server Components) con
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. **Nunca** exponer la service
  role al browser.
- Alternativa válida si se prefiere quedarse 100% en Vercel: **Vercel Postgres
  + Vercel Blob**. El blueprint asume Supabase; el patrón es equivalente.

### 3.2 Almacenamiento de imágenes → **Supabase Storage**
Buckets:
- `catalogo/` → imágenes finales de producto (las que ve la web).
- `uploads/` → fotos crudas que sube el dueño (input para KIE).
- `posts/` → piezas para redes.
Acceso público de lectura en `catalogo` y `posts`; `uploads` privado.

### 3.3 Sitio público → **Server Components + ISR / on-demand revalidate**
- El catálogo pasa a leerse desde Supabase en el server. `lib/catalogo.ts` queda
  como **seed/fallback** (los 17 reales) para el primer poblado y para no romper
  si Supabase no responde.
- Revalidación: `export const revalidate = 300` (ISR 5 min) **+** al guardar en
  el panel, llamar `revalidatePath('/')` y `revalidatePath('/catalogo')` para
  publicar al instante.

### 3.4 KIE.AI → **server-side, patrón async (task + poll)**
- `KIE_API_KEY` solo en el servidor. Base `https://api.kie.ai`,
  `Authorization: Bearer <KIE_API_KEY>`.
- Modelo recomendado: **`google/nano-banana-edit`** (Gemini 2.5 Flash Image,
  edición por instrucciones que preserva la moto real y cambia fondo/estilo).
  Alternativa: **`flux-kontext`** (Pro/Max). Confirmar nombres/endpoints exactos
  contra la doc vigente de KIE al ejecutar.
- KIE recibe la imagen como **URL** (no archivo crudo): por eso primero subimos
  la foto a `uploads/` y le pasamos esa URL pública/firmada.
- El cliente ya hace polling a `/api/kie-status?taskId=…` cada 3s → conservar.

---

## 4. Modelo de datos (Supabase)

```sql
-- Catálogo (fuente única)
create table motos (
  id            text primary key,           -- slug estable: "re-super-meteor-650"
  marca         text not null,              -- enum Marca
  modelo        text not null,
  segmento      text not null,              -- enum Segmento
  cc            int  not null,
  precio_lista  int  not null,              -- CLP
  precio_bono   int,                        -- CLP final si hay bono; null si no
  bono_vence    date,                       -- opcional: vigencia del descuento
  img           text not null,              -- URL pública en Storage
  usos          text[] not null default '{}',
  apta_principiante boolean not null default false,
  destacado     boolean not null default false,  -- aparece en ShowcasePremium
  orden         int not null default 0,     -- orden manual en catálogo
  activo        boolean not null default true,   -- baja lógica
  creado_en     timestamptz default now(),
  actualizado_en timestamptz default now()
);
create index on motos (activo, orden);

-- Leads capturados (Recomendador / Simulador / Contacto)
create table leads (
  id          uuid primary key default gen_random_uuid(),
  origen      text not null,                -- "recomendador" | "simulador" | "contacto"
  nombre      text,
  whatsapp    text,
  presupuesto text,
  uso         text,
  experiencia text,
  urgencia    text,
  score       text,                         -- hot | warm | cold
  payload     jsonb,                        -- datos crudos del form
  atendido    boolean default false,
  creado_en   timestamptz default now()
);

-- Tareas de IA (trazabilidad de KIE)
create table ia_tareas (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,                -- "foto-catalogo" | "foto-redes" | "post"
  task_id     text,                         -- id devuelto por KIE
  estado      text not null default 'pendiente', -- pendiente|procesando|listo|error
  input_url   text,
  output_url  text,
  meta        jsonb,
  creado_en   timestamptz default now()
);
```

> Seed inicial: script que inserta los **17 modelos reales** desde
> `lib/catalogo.ts` (subiendo sus `/public/motos/*.png` a `catalogo/`). Regla de
> oro del proyecto: **no inventar cifras** — solo migrar lo que ya existe.

---

## 5. Especificación por sección del panel

### 5.1 Stock — CRUD de motos 🔴
**Existe:** listar, buscar, paginar, agregar (MotoForm), eliminar.
**Falta:**
- **Editar** (lo pedido): `MotoForm` en modo edición → `PUT /api/motos` (o
  `PATCH /api/motos/[id]`). Reusar el `esquemaMoto` zod existente.
- En la tabla, botón **Editar** por fila (abre MotoForm precargado).
- Campos nuevos en el form: **destacado** (toggle), **orden**, **bono + vigencia**,
  **usos** (multi-select), **apta principiante**.
- **Reordenar** (drag) y **destacar** para controlar `ShowcasePremium`.
- Persistir en Supabase (reemplazar `stockAgregado`/`idsEliminados` en memoria).
- Al guardar/eliminar → `revalidatePath('/')` para publicar.

`/api/motos` queda:
- `GET` (público) → `select * from motos where activo order by orden`.
- `POST` (sesión) → insert.
- `PUT`/`PATCH` (sesión) → update por id. **(nuevo)**
- `DELETE` (sesión) → `activo = false`.

### 5.2 Estudio de Fotos IA — KIE.AI 🔴 (núcleo del pedido)

**Flujo completo:**
```
[Dueño sube foto cruda]
      │  (FormData → /api/procesar-imagen, con sesión)
      ▼
1. Validar (tipo imagen, ≤ 8MB) + subir a Storage uploads/  → URL
2. Construir el PROMPT según estilo (catalogo | redes)  ← sección 5.2.1
3. POST KIE createTask { model, input:{ prompt, image_urls:[URL] } }
      → { taskId }
4. Registrar en ia_tareas (estado=procesando) y devolver { taskId } al cliente
      ▼
[Cliente hace polling /api/kie-status?taskId=…  cada 3s]
      ▼
5. GET KIE recordInfo → cuando state=success:
   - descargar la imagen resultante
   - subirla a Storage catalogo/  → URL final
   - actualizar ia_tareas (estado=listo, output_url)
   - responder { estado:"listo", imagenUrl }
      ▼
[Preview del resultado + botón "Guardar al catálogo"]
      ▼
6. "Guardar al catálogo" → abre MotoForm precargado con imagenUrl = resultado
   → POST/PUT /api/motos
```

**Endpoints a implementar de verdad** (hoy son stubs):
- `POST /api/procesar-imagen`: pasos 1–4. Ya recibe `foto` + `estilo` por
  FormData y valida sesión y `KIE_API_KEY`. Falta: subir a Storage + llamar KIE
  + devolver `taskId`.
- `GET /api/kie-status?taskId=`: paso 5. Hoy responde 501.

**KIE API (forma esperada — confirmar contra doc vigente):**
```http
POST https://api.kie.ai/api/v1/jobs/createTask
Authorization: Bearer ${KIE_API_KEY}
Content-Type: application/json

{ "model": "google/nano-banana-edit",
  "input": { "prompt": "<PROMPT>", "image_urls": ["<URL_FOTO_CRUDA>"],
             "output_format": "png" } }
→ { "code": 200, "data": { "taskId": "abc123" } }

GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=abc123
Authorization: Bearer ${KIE_API_KEY}
→ { "data": { "state": "success",
              "resultJson": { "resultUrls": ["https://…png"] } } }
```
> Opción mejor que polling: registrar un **callbackUrl** (webhook) en createTask
> y un endpoint `/api/kie-callback` que actualice `ia_tareas`. Polling sirve
> igual y ya está en el cliente.

#### 5.2.1 Prompts de estilo (la "personalidad de la página")

Identidad: **Red Motos × Zero Motorcycles** — premium oscuro, acento rojo
`#E2231A`, limpio, cinemático, restraint. Las fotos de producto actuales en
`/public/motos/*.png` son **recortes limpios** (moto sobre fondo neutro). El
estilo `catalogo` debe ser consistente con eso.

**Estilo `catalogo`** (producto, va a las tarjetas del catálogo):
```
Studio product shot of this exact motorcycle, unchanged model/colors/badges.
Clean seamless studio background, neutral light grey (#f2f2f2) to white,
soft even softbox lighting, subtle floor reflection, 3/4 front angle,
centered, full vehicle in frame, no people, no clutter, no text, no logos
added. Photorealistic, high detail, sharp, color-accurate. Square 1:1.
```
> Salida lista para recortar a transparente (combinar con un pase de fondo
> transparente si se quiere igualar el 360). Mantener la moto **idéntica**:
> el prompt prohíbe cambiar modelo/colores/insignias.

**Estilo `redes`** (pieza para Instagram/TikTok):
```
Cinematic hero shot of this exact motorcycle on a dark premium studio
background (near-black #0b0b0c with subtle red rim light #E2231A), dramatic
low-key lighting, moody reflections, slight haze, lots of negative space for
text on the left. Keep the bike identical. Photorealistic, editorial,
high-end automotive ad look. Vertical 4:5.
```

> Reglas duras en ambos: "keep the bike identical, do not alter model, colors,
> decals or proportions". Validar el resultado siempre antes de publicar.

### 5.3 Generador de Posts 🟡
Ya hay UI (`GeneradorPost.tsx`) + `/api/generar-post` (stub). Completar:
- Caption con **Anthropic** (`ANTHROPIC_API_KEY`, Claude — usar la skill
  `claude-api` para el modelo/SDK correctos) según pilares de marca.
- Imagen con KIE (estilo `redes`).
- Guardar en `posts/` + copy listo para pegar (hashtags, CTA WhatsApp).

### 5.4 Funciones recomendadas para un panel "completo" 🟡🟢

> Consejos pedidos por el dueño. Priorizadas por impacto/esfuerzo.

1. **Bandeja de Leads** (alto impacto). Hoy `RecomendadorIA`, `SimuladorCuotas`
   y `Contacto` no guardan nada — los leads se pierden. Persistirlos en `leads`,
   listarlos en el panel con **score** (hot/warm/cold ya existe en tipos),
   filtro, marcar atendido y **botón "Responder por WhatsApp"** prearmado.
2. **Métricas en el dashboard**: total stock, # con descuento, # por marca,
   leads de la semana, último ingreso. Cards arriba del Stock.
3. **Gestión de destacados/orden** (ya cubierto en 5.1): controla qué motos
   salen en el carrusel `ShowcasePremium` y en qué orden — sin tocar código.
4. **Gestión de bonos/descuentos** con **fecha de vigencia** (`bono_vence`):
   el bono se apaga solo al vencer. Badge "Bono" automático.
5. **Testimonios/Clientes**: subir las fotos co-brandeadas de entregas
   (hoy 20 hardcodeadas) a Storage y administrarlas.
6. **Editor de contacto/sucursales/horarios**: hoy en `lib/config.ts` (fuente
   única). Exponer un subconjunto editable (teléfonos, horarios, direcciones)
   en una tabla `settings`.
7. **Media Library**: explorar/borrar imágenes de los buckets, reusar URLs.
8. **Exportar/backup** del catálogo a JSON (y **importar** los ~48 modelos
   pendientes vía CSV/JSON cuando el cliente entregue precios).
9. **Historial de actividad** (audit log): qué se cambió y cuándo.
10. **Preview antes de publicar**: estado `borrador` vs `publicado` con botón
    "Publicar" que dispara la revalidación.

---

## 7. Wiring del sitio público (O4)

- Crear `lib/motos-data.ts` con `getMotos()` (server) que lee Supabase y cae a
  `lib/catalogo.ts` si falla.
- Migrar `Catalogo.tsx` (y, si se quiere unificar, `ShowcasePremium` con
  `destacado`) a recibir las motos por props desde un Server Component, o a un
  fetch con ISR.
- `export const revalidate = 300` en `app/page.tsx` (o por ruta) + revalidación
  on-demand desde los endpoints de escritura.
- **Cuidado:** no romper las animaciones existentes (GSAP/Framer) ni el orden
  de secciones ya acordado. El catálogo dinámico solo cambia la *fuente* de
  datos, no el render.

---

## 8. Seguridad
- Mantener el gate `ADMIN_PASSWORD`; todos los `POST/PUT/DELETE` validan sesión
  (ya se hace). Considerar a futuro Supabase Auth para multiusuario.
- `KIE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`: **solo
  servidor**, nunca en componentes cliente ni en `NEXT_PUBLIC_*`.
- Subidas: validar tipo/tamaño (≤8MB), normalizar a webp, quitar EXIF.
- **Rate-limit** en `/api/procesar-imagen` y `/api/generar-post` (control de
  costo de IA) — p.ej. 20/día por sesión.
- Validación zod en todos los bodies (patrón ya presente).

---

## 9. Variables de entorno (`.env.local` + Vercel)
```
ADMIN_PASSWORD=            # ya en uso
ANTHROPIC_API_KEY=         # captions / recomendador real (opcional, hay fallback)
KIE_API_KEY=               # Estudio de Fotos + Generador de Posts
SUPABASE_URL=              # nuevo
SUPABASE_SERVICE_ROLE_KEY= # nuevo (solo server)
SUPABASE_ANON_KEY=         # opcional, si se usa cliente público
```
> Recordar cargarlas también en el proyecto de **Vercel** (Settings → Env Vars).

---

## 10. Plan de implementación por fases

> Ejecutar en orden. Cada fase termina con `npm run typecheck` y commit/push.

**Fase 1 — Persistencia (desbloquea todo)**
- Crear proyecto Supabase, aplicar schema (sección 4), buckets (5/3.2).
- `lib/supabase.ts` (cliente server con service role).
- Script de seed: migrar los 17 modelos + subir sus imágenes a `catalogo/`.
- Reescribir `/api/motos` GET/POST/DELETE contra Supabase + agregar `PUT`.

**Fase 2 — Sitio público dinámico (O4)**
- `lib/motos-data.ts` (`getMotos()` con fallback) + ISR + revalidación on-demand.
- Cablear `Catalogo.tsx` (y `ShowcasePremium` por `destacado` si se unifica).

**Fase 3 — Editar + gestión de catálogo (O2)**
- `MotoForm` modo edición + botón Editar en la tabla.
- Campos: destacado, orden, bono+vigencia, usos, apta principiante.
- (Opcional) drag para reordenar.

**Fase 4 — Estudio de Fotos IA (O3, núcleo)**
- Implementar `/api/procesar-imagen` (subir a Storage + KIE createTask) y
  `/api/kie-status` (recordInfo + copiar resultado a Storage).
- Prompts de sección 5.2.1. Cablear "Guardar al catálogo" → MotoForm precargado.
- Registrar en `ia_tareas`. Rate-limit.

**Fase 5 — Leads + métricas (O5)**
- Persistir leads desde Recomendador/Simulador/Contacto.
- Sección "Leads" en el panel + cards de métricas en el dashboard.

**Fase 6 — Generador de Posts (O6)** y **Fase 7 — nice-to-haves (O7)**.

---

## 11. Decisiones abiertas para Nicolás (resolver antes de ejecutar)
1. **Datastore**: ¿Supabase (recomendado) o Vercel Postgres+Blob?
2. **Modelo KIE** para fotos: ¿`nano-banana-edit` (recomendado) o `flux-kontext`?
   ¿Se quiere también un pase a **fondo transparente** para igualar el 360?
3. **Estilo catálogo**: ¿fondo neutro claro (como las fotos actuales) o
   transparente PNG? (define el prompt final).
4. **Leads**: ¿se priorizan en la primera entrega? (alto valor para el dueño).
5. **Multiusuario a futuro**: ¿solo el dueño, o varias cuentas (Supabase Auth)?

---
*Blueprint v1 · nico.agenteia · base auditada sobre el código existente.*
