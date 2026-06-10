import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";

// TODO: conectar KIE_API_KEY en .env.local — sondeo del estado de una
// tarea kie.ai iniciada por /api/generar-post o /api/procesar-imagen.
// El cliente hace polling cada 3s hasta recibir { estado: "listo" }.

export async function GET(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json(
      { error: "Falta el parámetro taskId" },
      { status: 400 },
    );
  }

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "KIE_API_KEY no está configurada." },
      { status: 503 },
    );
  }

  // TODO: consultar el estado real de la tarea en kie.ai.
  return NextResponse.json(
    { error: "Integración kie.ai pendiente de conectar." },
    { status: 501 },
  );
}
