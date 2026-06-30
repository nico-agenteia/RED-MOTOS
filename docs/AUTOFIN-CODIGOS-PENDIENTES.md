# Autofin — códigos de modelo pendientes de confirmar con José

Al cruzar el catálogo de Red Motos (48 motos) contra el "Catálogo Marcas-Modelos
Autofin Motos · junio 2026" ([docs/catalogo-autofin-motos-2026.xlsx](catalogo-autofin-motos-2026.xlsx)),
las **48 quedaron mapeadas**, pero algunas variantes de color/edición **no existen
exactas** en el maestro de Autofin. Para esas usamos el **modelo base** (homologa
igual; el detalle fino lo ajusta la tienda). Mapeo completo en
[lib/autofin-codigos.ts](../lib/autofin-codigos.ts).

## A. Sin variante exacta en Autofin — ✅ RESUELTO (jun-2026)

José Cumio creó los códigos exactos para las 3 variantes con precio distinto:

| Moto Red Motos | id | CodModelo asignado |
|---|---|---|
| Meteor 350 (Sundowner Orange) | `re-meteor-350-sundowner` | **10058** |
| Himalayan 452 (Rally) | `re-himalayan-452-rally` | **10059** |
| Classic 650 (Chrome) | `re-classic-650-chrome` | **10060** |

Ya actualizados en `lib/autofin-codigos.ts`.

## B. Modelos con código duplicado en el catálogo (confirmar el preferido)

Autofin tiene varias entradas para el mismo modelo. Elegimos una; conviene que
José confirme cuál es la vigente para inyección:

| Moto Red Motos | Código elegido | Otras entradas equivalentes |
|---|---|---|
| Suzuki GSX-S1000 | 10198 `GSX-S 1000` | 10233 `GSXS-1000`, 10276 `GSXS 1000` |
| Suzuki GSX-R1000R | 10270 `GSX-R1000 R` | 179 `GSXR1000R`, 10215 `GSXR 1000R` |
| Suzuki DR125L | 10273 `DRZ 125L` | 10217 `DR - Z125L`, 10222 `DRZ 125` |
| Suzuki GSX-8S | 10261 `GSX-8S` | 10249 `GSX 8S` |
| Kymco UXV 700iA | 10009 `UXV700IA` | 10011 `UXV 700 I`, 10016 `Uxv 700 Ia` |
| Kymco X-Town 300 | 10014 `X-TOWN 300` | 10006 `XTOWN 300`, 10017 `X-Town 300 2023` |

## Marcas (CodMarca) usadas

Royal Enfield = 160 · Suzuki = 52 · Kymco = 159 · Zonsen = 213 · Cyclone = 212
