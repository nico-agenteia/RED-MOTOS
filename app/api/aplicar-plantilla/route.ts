import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { componerPostInstagram } from "@/lib/componer-post";

// Re-aplica la plantilla de Instagram a una imagen YA generada por KIE.
// No llama a KIE: descarga la imagen existente, le compone el marco de marca y
// sube el resultado. Sirve para iterar sobre el diseño sin gastar créditos.

export async function POST(req: NextRequest) {
  const sesion = cookies().get(COOKIE_SESION)?.value;
  if (!esSesionValida(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let imagenUrl: string | undefined;
  try {
    const body = await req.json();
    imagenUrl = body?.imagenUrl;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!imagenUrl || typeof imagenUrl !== "string") {
    return NextResponse.json({ error: "Falta imagenUrl" }, { status: 422 });
  }

  // Descargar la imagen ya generada
  let imagenBuffer: Buffer;
  try {
    const res = await fetch(imagenUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    imagenBuffer = Buffer.from(await res.arrayBuffer());
  } catch {
    return NextResponse.json(
      { error: "No se pudo descargar la imagen" },
      { status: 502 },
    );
  }

  // Componer la plantilla
  let salida: Buffer;
  try {
    salida = await componerPostInstagram(imagenBuffer);
  } catch (err) {
    console.error("[aplicar-plantilla] Error componiendo:", err);
    return NextResponse.json(
      { error: "No se pudo componer la plantilla" },
      { status: 500 },
    );
  }

  // Subir al bucket posts
  const sb = getSupabase();
  const nombre = `post-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error: uploadError } = await sb.storage
    .from("posts")
    .upload(nombre, salida, { contentType: "image/webp", upsert: true });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error subiendo: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: urlData } = sb.storage.from("posts").getPublicUrl(nombre);
  return NextResponse.json({ imagenUrl: urlData.publicUrl });
}
