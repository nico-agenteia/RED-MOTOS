import { NextRequest, NextResponse } from "next/server";
import { obtenerConfigSpider } from "@/lib/autofin";

// nodejs (no edge): los tokens de Autofin solo deben vivir en el runtime server.
export const runtime = "nodejs";

/**
 * GET /api/autofin/config → proxy server-side de CONFIGURACION-SPIDER (Autofin).
 * Único punto de contacto del browser con la config: el token nunca sale de aquí.
 *
 * Opcional `?codSpider=` para verificar otra sucursal en QA (p. ej. la de motos
 * C088S17001I010 vs. la de autos C001S491). Sin el parámetro usa AUTOFIN_COD_SPIDER.
 */
export async function GET(req: NextRequest) {
  const codSpider = req.nextUrl.searchParams.get("codSpider") ?? undefined;

  try {
    const config = await obtenerConfigSpider(codSpider);
    return NextResponse.json(config);
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
