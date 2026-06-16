# 🕷️ Blueprint — Integración Autofin "Araña 2.0" (Simulador de cuotas real)

> Documento de planificación. **No se ejecuta en esta sesión.** En una sesión
> nueva, leer completo y ejecutar por fases.
> Base: *Manual de Implementación de Araña 2.0* (Autofin, v1.12 · nov 2025).
> Repo: `clientes/red-motos/web` → `nico-agenteia/RED-MOTOS`.

---

## 0. TL;DR — enfoque elegido

**Híbrido, manteniendo nuestro UI premium:**

1. **Cuota real con nuestro diseño** → nuestro `SimuladorCuotas` deja de usar el
   cálculo placeholder (`cuotaFrancesa` + `TASA_MENSUAL_REFERENCIAL`) y pasa a
   pedir la cuota al endpoint **CUOTA-TRINIDAD** de Autofin (valor cuota + CAE +
   costo total, idéntico a Trinidad). El look & feel sigue siendo nuestro.
2. **Envío de la solicitud → Opción A (iFrame) primero.** Al apretar "Solicitar",
   abrimos el **iFrame de Araña** prellenado con la moto (y datos básicos si los
   hay). Autofin maneja el formulario del cliente, la inyección y la evaluación
   de riesgo. **Ventaja clave:** los datos sensibles (RUT, renta) los maneja
   Autofin, no nosotros.
3. **Fase 2 (opcional, más adelante):** reemplazar el iFrame por el endpoint
   **INYECCION-TRINIDAD** con nuestro propio formulario (control total). Migrable
   sin rehacer la fase 1.
4. **CRM:** un webhook nuestro recibe el resultado de Autofin y lo escribe a
   **Google Sheets** (rápido, el dueño lo ve fácil). Diseñado para también
   escribir a nuestro **panel (Supabase)** en el futuro.

Arrancamos en **QA (tokens de prueba del manual)** y migramos a producción cuando
Autofin entregue credenciales prod.

---

## 1. Recordatorio del modelo Araña (breve)

Araña 2.0 expone 2 modelos: **iFrame** (UI de Autofin embebida) y **API REST**
(3 endpoints). Nosotros usamos **API REST para la cuota** (mantiene nuestro UI) e
**iFrame para el envío** (rápido y sin manejar PII). Ambos modelos comparten los
mismos **webhooks** opcionales de resultado y seguimiento.

Los 3 endpoints REST:
- **CONFIGURACION-SPIDER** (GET) → config del negocio: productos, plazos/montos
  min-max, seguros, códigos (CES, sucursal, vendedor). **Alimenta a los otros.**
- **CUOTA-TRINIDAD** (POST) → valor cuota + CAE + costo total. ← lo usamos.
- **INYECCION-TRINIDAD** (POST) → crea la solicitud + evaluación. ← Fase 2.

---

## 2. Arquitectura de la integración

```
┌────────────────────────── NUESTRA WEB (Next.js) ──────────────────────────┐
│                                                                            │
│  SimuladorCuotas (UI nuestra)                                              │
│    │  valor moto, pie, plazo, seguros                                      │
│    ▼                                                                       │
│  POST /api/autofin/cuota  ───────►  (server, token oculto)                 │
│    │        │  arma body CUOTA-TRINIDAD con códigos de config              │
│    │        ▼                                                              │
│    │   GET  /api/autofin/config (cacheado) ──► CONFIGURACION-SPIDER (QA)   │
│    │        └─ productos, plazos, seguros, Dealer/Sucursal                 │
│    ▼                                                                       │
│  ◄── { valorCuota, CAE, costoTotal }   →  mostramos cuota REAL             │
│                                                                            │
│  [Botón "Solicitar financiamiento"]                                        │
│    └─► abre iFrame de Araña prellenado (Opción A)  ──► Autofin evalúa      │
│                                                                            │
│  Webhooks (los exponemos nosotros, Autofin los llama):                     │
│    POST /api/autofin/resultado  ─► escribe a Google Sheets (CRM)           │
│    POST /api/autofin/estado     ─► actualiza estado en Sheets              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Regla de oro:** los tokens y la comunicación con Autofin van **solo en el
servidor** (API routes de Next). El browser nunca ve un token. Esto además
**resuelve CORS** (es server-to-server, no fetch desde el navegador).

---

## 3. Variables de entorno (QA por ahora)

```
# Autofin Araña 2.0 — QA (los tokens están en el Manual v1.12, sección 4.2)
AUTOFIN_BASE_URL=https://fabdigital-qa.autofin.cl/autofin/api
AUTOFIN_SPIDER_URL=https://spiderqa.autofin.cl        # base del iFrame
AUTOFIN_COD_SPIDER=                                    # código de sucursal (ej QA config: C001S491)
AUTOFIN_TOKEN_CONFIG=                                  # token endpoint configuracion-spider
AUTOFIN_TOKEN_CUOTA=                                   # token endpoint cuota-trinidad
AUTOFIN_TOKEN_INYECCION=                               # token endpoint inyeccion-trinidad (Fase 2)
AUTOFIN_WEBHOOK_SECRET=                                # secreto compartido para validar callbacks (pedir a Autofin)

# CRM — Google Sheets
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=                            # private key (server only)
```
> ⚠️ **Nunca** commitear los tokens reales. Van en `.env.local` y en Vercel.
> El manual trae 3 tokens distintos (uno por endpoint) — respetarlos.

---

## 4. Endpoints que consumimos (vía proxy server-side)

### 4.1 `GET /api/autofin/config` → CONFIGURACION-SPIDER
- Llama `GET {AUTOFIN_BASE_URL}/configuracion-spider/v1/{AUTOFIN_COD_SPIDER}?token=...`
- Devuelve (resumido): `SEGUROS`, `VEHICULOS` (Autos/Motos), `CONFIGURACION`
  (CodigoCES, CodigoSucursal, CodigoVendedor), y por producto: **NEGOCIOS**,
  **PRODUCTOS**, **CUOTAS** (plazos disponibles), montos min/max, `RANGOVFMG`.
- **Uso:** de aquí salen los plazos que muestra el simulador, los seguros
  aplicables a motos y los códigos `Dealer`/`Sucursal`/`Producto`/`TipoCredito`
  que necesita el endpoint de cuota. **Cachear** (revalidar cada X horas) — no
  cambia seguido.

### 4.2 `POST /api/autofin/cuota` → CUOTA-TRINIDAD
- Recibe de nuestro simulador: `{ precio, montoPie, plazo, seguros? }`.
- Arma el body con los códigos de config y llama
  `POST {AUTOFIN_BASE_URL}/cuota-trinidad/v1?token=...`:
```json
{ "ConsultaCuotaReqRest": {
    "Precio": 2399900, "MontoPie": 500000, "Plazo": 48,
    "Producto": <de config>, "TipoCredito": <de config>,
    "Seguros": { "Desgravamen": false, "Cesantia": false, "AutoProtegido": false,
                 "PerdidaTotal": false, "ReparacionesMenores": false, "RDH": true,
                 "GPS": false, "GarantiaMecanica": false },
    "MontoVFMG": 0,                          // 0 para motos/Convencional
    "Marca": "<marca>", "Modelo": "<modelo>", "Anno": 2024,
    "Dealer": <CodigoCES>, "Sucursal": <CodigoSucursal>,
    "EstadoVehiculo": "N" } }
```
- Respuesta esperada: **valor cuota, CAE y costo total** → los mostramos en el
  panel de resultado del simulador (con count-up GSAP que ya existe).
- Notas: `MontoVFMG` solo aplica a Auto Renuévate; para motos = 0. Los seguros
  por defecto vienen de la config (cuáles aplican a motos).

> El **endpoint de cuota** solo recibe **datos del vehículo** — **ningún dato
> personal**. Privacidad mínima en esta fase.

---

## 5. Envío de la solicitud — Opción A (iFrame)

Al apretar "Solicitar financiamiento", abrimos (modal a pantalla completa o vista
dedicada) el iFrame de Araña para motos:
```
{AUTOFIN_SPIDER_URL}/{codSpider}?businessType=2&vehicleStatus=1&isMoto=true
  &brand={codMarcaAutofin}&model={codModeloAutofin}&year={anio}&price={precio}
  &firstName=&lastName=&rut=&phone=&email=&idExterno={nuestroLeadId}
```
- `businessType`: 2 = Convencional (motos). `vehicleStatus`: 1 = Nuevo.
- `idExterno`: **nuestro id de lead** → así cruzamos la respuesta del webhook con
  el lead de nuestra web.
- Los campos del cliente van vacíos (el cliente los llena dentro de Araña) o
  prellenados si ya los capturamos antes (nombre/teléfono/email).
- Autofin: muestra simulador→form→resumen→envía→evalúa→manda correo + (si
  configuramos) llama nuestro webhook.

> El iFrame tiene **su propio diseño** (Autofin). Para que no choque, lo
> presentamos dentro de un contenedor con nuestro encabezado/cierre y, si se
> puede, con ancho acotado. Es el trade-off conocido de la Opción A.

---

## 6. Webhooks que exponemos (Autofin → nosotros)

Se configuran en la parametría de Araña (le pasamos las URLs a Autofin).

### 6.1 `POST /api/autofin/resultado` (resultado de inyección + evaluación)
Body que recibimos (estructura del manual, 3.3):
```json
{ "ResumenSpider": {
    "DatosSolicitud": { "IdTrinidad": 123456, "FechaInyeccion": "...",
      "EstadoEvaluacion": "Aprobado|En Evaluación", "EstadoTrinidad": "...",
      "CodigoExterno": "<nuestroLeadId>", "Producto": "...", "Marca": "...",
      "Modelo": "...", "Annio": 2024, "EstadoVehiculo": "Nuevo",
      "PrecioVehiculo": 2399900, "Pie": 500000, "Plazo": 48,
      "ValorCuota": 170190, "CAE": "26.22" },
    "DatosCliente": { "Nombre": "...", "Rut": "...", "Email": "...", "...": "..." },
    "DatosDealer": { "CodDealer": 1, "NomSucursal": "...", "...": "..." } } }
```
- Resultados posibles: **Aprobado / Dudoso / Rechazado** ("Dudoso" = en revisión
  de analista).
- **Acción:** validar el secreto, normalizar y **escribir una fila en Google
  Sheets** (ver §7). Cruzar por `CodigoExterno` con nuestro lead.

### 6.2 `POST /api/autofin/estado` (seguimiento de estado)
Body (manual, 3.4):
```json
{ "DatosSolicitud": { "IdTrinidad": 123456, "EstadoAnterior": "Evaluacion",
    "EstadoNuevo": "Rechazado", "CodEstadoNuevo": 6,
    "FechaCambioEstado": "07/03/2024 10:30", "Resolucion": "..." } }
```
- **Acción:** actualizar la fila correspondiente (por `IdTrinidad`) en Sheets.

---

## 7. CRM — recomendación

| Opción | Pros | Contras |
|--------|------|---------|
| **Google Sheets (recomendado para arrancar)** | Cero infraestructura; el dueño abre, filtra y exporta; rápido de montar | No es una app; sin lógica avanzada |
| Nuestro panel (Supabase) | Integrado al admin, estados, métricas | Requiere construir la capa de datos (blueprint admin) |

**Decisión:** webhook → **un solo handler nuestro** → escribe a **Google Sheets**
ahora. Cuando construyamos el panel admin (otro blueprint), el mismo handler
también escribe a Supabase. Una pestaña "Solicitudes" en el Sheet con columnas:
`fecha, leadId, IdTrinidad, marca, modelo, precio, pie, plazo, valorCuota, CAE,
resultado, estado, nombre, rut, email, telefono, resolucion`.

Implementación Sheets: cuenta de servicio de Google + `googleapis` (o un
Apps Script Web App como receptor simple). Server-side only.

---

## 8. Cambios en nuestro código y datos

- **`lib/tipos.ts` / catálogo:** agregar a cada moto los **códigos Autofin**:
  `autofinBrand` (code), `autofinModel` (code), `anio`, `estadoVehiculo` ("N").
  → **Pendiente:** obtener los códigos reales (ver §12.2). Para QA se puede usar
  el ejemplo del manual (`brand=52&model=178`, codSpider de motos
  `C088S17001I010`) para probar el flujo end-to-end.
- **`SimuladorCuotas.tsx`:** reemplazar el cálculo local por `fetch
  /api/autofin/cuota`; mostrar **CAE** y **costo total** además de la cuota;
  poblar los plazos desde `/api/autofin/config`; estado de carga/errores.
- **Nuevas rutas API (server):** `app/api/autofin/config`, `.../cuota`,
  `.../resultado`, `.../estado` (+ `.../inyeccion` en Fase 2).
- **`lib/autofin.ts`:** cliente server con los tokens, helpers de mapeo
  (config → códigos) y armado de bodies.
- **Lead:** al abrir el iFrame, crear/registrar el lead con un `leadId` y pasarlo
  como `idExterno` para cruzar la respuesta.

---

## 9. Seguridad
- Tokens Autofin y credenciales Google **solo server-side** (env, nunca
  `NEXT_PUBLIC_*`). Las rutas `/api/autofin/*` son el único punto de contacto.
- **CORS:** no aplica — todo es server-to-server. El browser solo habla con
  nuestras rutas.
- **Webhooks:** validar un **secreto compartido** (`AUTOFIN_WEBHOOK_SECRET`) o
  IP allowlist — **pedir a Autofin** cómo autentican el callback (header/token).
- Rate-limit suave en `/api/autofin/cuota` (evitar abuso del simulador).

## 10. Privacidad (importante)
- **Fase 1 (iFrame):** el RUT, renta y datos laborales los captura **Autofin**
  dentro de su iFrame → **nosotros no los almacenamos**. El webhook sí trae datos
  del cliente: guardarlos en Sheets implica tratar datos personales → incluir
  **consentimiento** y aviso de privacidad, y restringir acceso al Sheet.
- **Fase 2 (API inyección):** ahí sí capturaríamos PII en nuestro form →
  reforzar consentimiento, no loguear, HTTPS, mínimos datos.

---

## 11. Plan de implementación por fases

**Fase 0 — Setup QA**
- Cargar env QA, crear `lib/autofin.ts`, ruta `/api/autofin/config` y verificar
  que devuelve la config de motos (con codSpider de prueba).

**Fase 1 — Cuota real en nuestro UI** 🔴
- `/api/autofin/cuota` + cablear `SimuladorCuotas` → mostrar cuota + CAE reales.
- Poblar plazos desde config. Manejo de carga/errores + fallback al cálculo
  actual si Autofin no responde.

**Fase 2 — Envío vía iFrame (Opción A)** 🔴
- Botón "Solicitar" → modal con iFrame prellenado + `idExterno` = leadId.

**Fase 3 — Webhooks → Google Sheets (CRM)** 🔴
- `/api/autofin/resultado` y `/api/autofin/estado` → escribir/actualizar en
  Sheets. Entregar las URLs a Autofin para que las configure.

**Fase 4 — Producción**
- Cambiar a credenciales/URLs prod, mapear los códigos reales del catálogo de
  Red Motos, QA end-to-end real.

**Fase 5 (opcional) — Migrar a Opción B**
- Formulario propio + `/api/autofin/inyeccion` (INYECCION-TRINIDAD v2) +
  el mismo webhook. También volcar las solicitudes al panel admin (Supabase).

---

## 12. Estado de lo que se necesita de Autofin

| # | Necesidad | Estado / decisión |
|---|-----------|-------------------|
| 1 | Credenciales | **QA por ahora** (tokens del manual). Pendiente: PROD. |
| 2 | Catálogo de códigos marca/modelo | El **manual NO trae catálogo completo**, solo ejemplos. Los códigos reales salen del **endpoint de configuración** (sección VEHICULOS) o los pide a Autofin. Para QA usar el ejemplo (`brand=52, model=178`). |
| 3 | Producto/plazos/montos/seguros de motos | **No hardcodear** — se **leen del endpoint CONFIGURACION-SPIDER** en runtime. |
| 4 | CRM destino del webhook | **Google Sheets ahora** (recomendado), panel (Supabase) después. Un solo handler que pueda escribir a ambos. |
| 5 | CORS / server-to-server | **Resuelto por diseño**: proxy en rutas Next, todo server-side. |
| 6 | Privacidad | **Fase 1 minimiza PII** (los datos sensibles los maneja el iFrame de Autofin). Sheets con consentimiento + acceso restringido. |

---

## 13. Decisiones abiertas (antes de Fase 4/prod)
1. ¿`codSpider` propio de Red Motos para QA? (pedir a Autofin aunque sea de prueba).
2. ¿Cómo autentica Autofin el **webhook** entrante? (secreto/header/IP).
3. ¿Qué **seguros** quiere mostrar/ofrecer Red Motos en el simulador de motos?
4. ¿`businessType` para motos siempre Convencional (2)?
5. Texto de **consentimiento/privacidad** para el lead y el Sheet.

---
*Blueprint v1 · nico.agenteia · integración Autofin Araña 2.0 (híbrido: cuota
API + envío iFrame).*
