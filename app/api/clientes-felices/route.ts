import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { componerClienteFeliz } from "@/lib/componer-cliente-feliz";
import type { ClienteFeliz } from "@/lib/tipos";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

function autorizado(): boolean {
  return esSesionValida(cookies().get(COOKIE_SESION)?.value);
}

/** Detecta HEIC/HEIF por MIME, extensión o caja ftyp (igual que procesar-imagen). */
function esHeic(buf: Buffer, nombre: string, tipo: string): boolean {
  if (/heic|heif/i.test(tipo)) return true;
  if (/\.(heic|heif)$/i.test(nombre)) return true;
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const marca = buf.toString("ascii", 8, 12);
    return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(marca);
  }
  return false;
}

function filaACliente(f: Record<string, unknown>): ClienteFeliz {
  return {
    id: f.id as string,
    imgUrl: f.img_url as string,
    nombre: (f.nombre as string | null) ?? null,
    marca: (f.marca as string | null) ?? null,
    modelo: (f.modelo as string | null) ?? null,
    orden: (f.orden as number) ?? 0,
    activo: Boolean(f.activo),
  };
}

/** POST → subir foto, componer marco y publicar. Solo admin. */
export async function POST(req: NextRequest) {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const foto = formData.get("foto");
  const nombre = (formData.get("nombre") as string | null)?.trim() || null;
  const marca = (formData.get("marca") as string | null)?.trim() || null;
  const modelo = (formData.get("modelo") as string | null)?.trim() || null;

  if (!foto || !(foto instanceof File)) {
    return NextResponse.json({ error: "Falta la foto (File)" }, { status: 422 });
  }
  const esImagen =
    foto.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|heic|heif)$/i.test(foto.name);
  if (!esImagen) {
    return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 422 });
  }
  if (foto.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen no puede superar los 12 MB" }, { status: 422 });
  }

  // Normalizar HEIC (iPhone) a JPEG; sharp se encarga del resto en el compositor.
  const original = Buffer.from(await foto.arrayBuffer());
  let entrada = original;
  if (esHeic(original, foto.name, foto.type)) {
    try {
      const heicConvert = (await import("heic-convert")).default;
      const jpeg = await heicConvert({ buffer: original, format: "JPEG", quality: 0.92 });
      entrada = Buffer.from(jpeg);
    } catch (err) {
      console.error("[clientes-felices] HEIC:", err);
      return NextResponse.json(
        { error: "No se pudo leer la foto HEIC del teléfono. Prueba con JPG o PNG." },
        { status: 422 },
      );
    }
  }

  // Componer el marco co-brandeado.
  let salida: Buffer;
  try {
    const moto = [marca, modelo].filter(Boolean).join(" ");
    salida = await componerClienteFeliz(entrada, {
      nombre: nombre ?? undefined,
      moto: moto || undefined,
    });
  } catch (err) {
    console.error("[clientes-felices] componer:", err);
    return NextResponse.json(
      { error: "No se pudo componer la imagen", detalle: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  // Subir al bucket público posts/ con prefijo clientes/.
  const sb = getSupabase();
  const archivo = `clientes/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error: uploadError } = await sb.storage
    .from("posts")
    .upload(archivo, salida, { contentType: "image/webp", upsert: true });
  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo: ${uploadError.message}` }, { status: 500 });
  }
  const { data: urlData } = sb.storage.from("posts").getPublicUrl(archivo);

  // Registrar en la tabla (alimenta la web pública).
  try {
    const { data, error } = await sb
      .from("clientes_felices")
      .insert({
        img_url: urlData.publicUrl,
        nombre,
        marca,
        modelo,
        orden: 0,
        activo: true,
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, cliente: filaACliente(data) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/clientes-felices] insert:", err);
    // La imagen se compuso y subió; devolvemos la URL aunque falle el registro.
    return NextResponse.json(
      { ok: true, imagenUrl: urlData.publicUrl, advertencia: "No se guardó en la galería." },
      { status: 201 },
    );
  }
}

/** GET → listar todos (solo admin; la web pública usa lib/clientes-felices-data). */
export async function GET() {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("clientes_felices")
      .select("*")
      .order("orden", { ascending: true })
      .order("creado_en", { ascending: false })
      .limit(300);
    if (error) throw error;
    return NextResponse.json({ clientes: (data ?? []).map(filaACliente) });
  } catch (err) {
    console.error("[GET /api/clientes-felices]", err);
    return NextResponse.json({ error: "Error al obtener la galería" }, { status: 500 });
  }
}

/** PATCH ?id= → activar/desactivar o reordenar (solo admin). */
export async function PATCH(req: NextRequest) {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  let body: { activo?: boolean; orden?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* opcional */
  }
  const cambios: Record<string, unknown> = {};
  if (typeof body.activo === "boolean") cambios.activo = body.activo;
  if (typeof body.orden === "number") cambios.orden = body.orden;
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    const { error } = await sb.from("clientes_felices").update(cambios).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/clientes-felices]", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

/** DELETE ?id= → borrar (solo admin). */
export async function DELETE(req: NextRequest) {
  if (!autorizado()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  try {
    const sb = getSupabase();
    // Borrar el objeto de Storage (best-effort) antes de la fila.
    const { data: fila } = await sb
      .from("clientes_felices")
      .select("img_url")
      .eq("id", id)
      .single();
    const url = fila?.img_url as string | undefined;
    if (url) {
      const idx = url.indexOf("/posts/");
      if (idx !== -1) {
        const ruta = url.slice(idx + "/posts/".length);
        await sb.storage.from("posts").remove([ruta]).catch(() => {});
      }
    }
    const { error } = await sb.from("clientes_felices").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/clientes-felices]", err);
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}
