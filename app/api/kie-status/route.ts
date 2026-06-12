import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

// TODO: conectar KIE_API_KEY en .env.local — sondeo del estado de una
// tarea kie.ai iniciada por /api/generar-post o /api/procesar-imagen.
// El cliente hace polling cada 3s hasta recibir { estado: "listo" }.

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { error: "Integración kie.ai pendiente de conectar." },
    { status: 501 },
  );
}
