import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_SESION,
  DURACION_SESION_DIAS,
  esPasswordValida,
  esSesionValida,
  tokenSesion,
} from "@/lib/auth";

/** POST { password } → setea cookie de sesión (7 días) si es correcta. */
export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no está configurada en .env.local" },
      { status: 500 },
    );
  }

  if (!esPasswordValida(password)) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, tokenSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURACION_SESION_DIAS * 24 * 60 * 60,
    path: "/",
  });
  return res;
}

/** DELETE → cierra la sesión. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, "", { maxAge: 0, path: "/" });
  return res;
}

/** GET → indica si hay sesión activa. */
export async function GET() {
  const valor = cookies().get(COOKIE_SESION)?.value;
  return NextResponse.json({ sesionActiva: esSesionValida(valor) });
}
