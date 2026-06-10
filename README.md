# 🏍️ Red Motos Chile — Web oficial

Sitio premium de **Red Motos Chile** (concesionaria multimarca, punto oficial
Royal Enfield) construido según `../PROMPT-ONE-SHOT.md`.

**Fórmula de diseño:** Red Motos (alma chilena, real, confiable) × Zero
Motorcycles (estructura premium, restraint, showcase cinemático).

## Cómo correr

```bash
npm install && npm run dev
```

→ http://localhost:3000 · Panel admin en `/admin` (requiere `ADMIN_PASSWORD`
en `.env.local`, ver `.env.example`).

## Stack

Next.js 14 (App Router) + TypeScript · Tailwind CSS · Framer Motion (micro) ·
GSAP ScrollTrigger (salas de marca) · zod (validación admin).

## Estructura

```
app/
  layout.tsx            fuentes (Barlow Condensed/Inter/JetBrains Mono) + SEO completo
  page.tsx              one-pager: 11 secciones
  globals.css           design system (tokens primitivos→semánticos)
  admin/                panel con gate por contraseña (cookie 7 días)
  api/                  login · motos (CRUD) · generar-post · procesar-imagen · kie-status
components/
  Nav · Hero · Marcas · Catalogo · SalaRoyalEnfield · SalaSuzuki ·
  RecomendadorIA · SimuladorCuotas · Clientes · Beneficios · Contacto · WhatsAppFloat
  admin/  LoginGate · AdminDashboard · MotoForm · GeneradorPost · EstudioFotos · NuevaMoto
lib/
  config.ts             ⭐ ÚNICA fuente de marca/contacto
  catalogo.ts           17 modelos REALES (precios scrapeados de redmotos.cl)
  tipos.ts · utils.ts · auth.ts
```

## Datos reales vs pendientes

- ✅ **17 modelos con precios reales** (scrape de redmotos.cl 2026-06-09),
  bonos incluidos. Fotos de producto oficiales en `public/motos/`.
- ✅ 20 testimonios co-brandeados reales · 8 logos de marca · slides del hero.
- ⏳ **El resto del stock (hasta ~48 modelos)**: el archivo
  `catalogo/catalogo-stock.json` referenciado en el prompt no existe aún.
  Cuando el cliente entregue los precios, agregar los modelos a
  `lib/catalogo.ts` (regla: **no inventar cifras**).
- ⏳ **kie.ai** (generador de posts + estudio de fotos): endpoints y UI
  listos, falta conectar `KIE_API_KEY` (buscar `TODO` en `app/api/`).
- ⏳ **Recomendador IA real** (`/api/recomendar` con Claude Haiku): hoy usa
  lógica local en `lib/utils.ts` que funciona sin API key.

## Calidad

- LCP: `fetchpriority="high"` solo en el hero; el resto `loading="lazy"`.
- CLS: todas las `<img>` con `width`/`height` explícitos.
- INP: animaciones solo con `transform`/`opacity`.
- `prefers-reduced-motion` desactiva todas las animaciones.
- Accesibilidad: foco visible (ring rojo), aria-labels, roles semánticos,
  touch targets ≥ 44px.

## Verificado

`npm run typecheck` ✓ · `npm run build` ✓ (11 rutas, landing 183 kB First
Load JS) · smoke test `/`, `/admin`, `/api/motos` → 200.

---
*Construido con nico.agenteia · 2026-06*
