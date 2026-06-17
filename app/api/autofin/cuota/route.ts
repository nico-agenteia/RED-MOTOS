import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obtenerCuotaMoto } from "@/lib/autofin";

// nodejs (no edge): los tokens de Autofin solo deben vivir en el runtime server.
export const runtime = "nodejs";

const esquema = z.object({
  precio: z.coerce.number().int().positive(),
  montoPie: z.coerce.number().int().nonnegative(),
  plazo: z.coerce.number().int().positive(),
});

/**
 * POST /api/autofin/cuota → cuota real (CUOTA-TRINIDAD) con nuestro UI.
 * Recibe `{ precio, montoPie, plazo }`; los códigos del producto y el token
 * se resuelven server-side. Si Autofin rechaza o no responde, devuelve 502 y
 * el simulador cae a su cálculo referencial local.
 */
export async function POST(req: NextRequest) {
  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const r = esquema.safeParse(datos);
  if (!r.success) {
    return NextResponse.json(
      { error: "Validación falló", detalles: r.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const cuota = await obtenerCuotaMoto(r.data);
    return NextResponse.json(cuota);
  } catch (err) {
    console.error("[POST /api/autofin/cuota]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error al calcular la cuota",
      },
      { status: 502 },
    );
  }
}
