import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";

// TODO: conectar KIE_API_KEY en .env.local — este endpoint inicia la
// generación de un post (imagen kie.ai + caption Claude) y devuelve un
// taskId para sondear en /api/kie-status. Patrón async obligatorio por el
// límite de tiempo de las funciones serverless.

export async function POST(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { motoId?: string; estilo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.motoId || !body.estilo) {
    return NextResponse.json(
      { error: "Faltan motoId o estilo (catalogo | redes)" },
      { status: 422 },
    );
  }

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      {
        error:
          "KIE_API_KEY no está configurada. Agrega la key en .env.local para activar el generador de posts.",
      },
      { status: 503 },
    );
  }

  // TODO: llamar a kie.ai (nano-banana-2) con la imagen de la moto y la
  // receta del estilo elegido; persistir el taskId real.
  return NextResponse.json(
    { error: "Integración kie.ai pendiente de conectar." },
    { status: 501 },
  );
}
