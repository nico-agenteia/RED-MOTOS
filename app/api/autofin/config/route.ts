import { NextRequest, NextResponse } from "next/server";
import { obtenerOpcionesMoto } from "@/lib/autofin";

// nodejs (no edge): los tokens de Autofin solo deben vivir en el runtime server.
export const runtime = "nodejs";

/**
 * GET /api/autofin/config → opciones del simulador de motos (plazos + rangos de
 * pie/precio), normalizadas desde CONFIGURACION-SPIDER. El token y los códigos
 * internos nunca salen del server; al browser solo le llega lo que el UI usa.
 *
 * Opcional `?codSpider=` para verificar otra sucursal en QA. Sin el parámetro
 * usa AUTOFIN_COD_SPIDER.
 */
export async function GET(req: NextRequest) {
  const codSpider = req.nextUrl.searchParams.get("codSpider") ?? undefined;

  try {
    const opciones = await obtenerOpcionesMoto(codSpider);
    return NextResponse.json(opciones);
  } catch (err) {
    console.error("[GET /api/autofin/config]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error al obtener la configuración de Autofin",
      },
      { status: 502 },
    );
  }
}
