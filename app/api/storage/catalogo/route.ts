import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sb = getSupabase();

  const { data, error } = await sb.storage
    .from("catalogo")
    .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    return NextResponse.json(
      { error: `Error listando storage: ${error.message}` },
      { status: 500 },
    );
  }

  const imagenes = (data ?? [])
    .filter((f) => f.name && /\.(jpe?g|png|webp|avif)$/i.test(f.name))
    .map((f) => {
      const { data: urlData } = sb.storage
        .from("catalogo")
        .getPublicUrl(f.name);
      return {
        nombre: f.name,
        url: urlData.publicUrl,
        creado: f.created_at,
      };
    });

  return NextResponse.json({ imagenes });
}

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Máximo 10 MB" }, { status: 422 });
  }

  const original = Buffer.from(await file.arrayBuffer());
  let buffer: Buffer = original;
  let extension = "webp";
  let contentType = "image/webp";

  try {
    const sharp = (await import("sharp")).default;
    buffer = await sharp(original)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    buffer = original;
    extension = (file.name.split(".").pop() || "jpg").toLowerCase();
    contentType = file.type || "application/octet-stream";
  }

  const sb = getSupabase();
  const nombre = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error: uploadError } = await sb.storage
    .from("catalogo")
    .upload(nombre, buffer, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: urlData } = sb.storage.from("catalogo").getPublicUrl(nombre);
  return NextResponse.json({ url: urlData.publicUrl, nombre });
}
