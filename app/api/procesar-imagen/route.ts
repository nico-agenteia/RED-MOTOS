import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";

// TODO: conectar KIE_API_KEY en .env.local — Estudio de Fotos IA:
// recibe la foto cruda subida por el dueño + estilo (catalogo | redes),
// inicia un img2img en kie.ai y devuelve taskId para sondear en
// /api/kie-status (patrón async por límite serverless).

export async function POST(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const foto = formData?.get("foto");
  const estilo = formData?.get("estilo");

  if (!foto || !estilo) {
    return NextResponse.json(
      { error: "Faltan la foto o el estilo (catalogo | redes)" },
      { status: 422 },
    );
  }

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      {
        error:
          "KIE_API_KEY no está configurada. Agrega la key en .env.local para activar el estudio de fotos.",
      },
      { status: 503 },
    );
  }

  // TODO: subir la foto a storage temporal y llamar a kie.ai img2img.
  return NextResponse.json(
    { error: "Integración kie.ai pendiente de conectar." },
    { status: 501 },
  );
}
