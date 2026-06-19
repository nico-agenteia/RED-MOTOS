import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_SESION,
  DURACION_SESION_DIAS,
  esPasswordValida,
  esSesionValida,
  tokenSesion,
} from "@/lib/auth";

// Rate-limit del login: máximo de intentos fallidos por IP en una ventana.
// ⚠️ El contador vive en memoria del proceso: en serverless con varias
// instancias la protección es parcial (cada instancia cuenta aparte). Sirve
// como freno básico a la fuerza bruta; la defensa real es un ADMIN_PASSWORD
// fuerte. Para algo robusto, mover el contador a Supabase/Upstash.
const MAX_INTENTOS = 8;
const VENTANA_MS = 10 * 60 * 1000; // 10 minutos
const intentosPorIp = new Map<string, { count: number; resetAt: number }>();

function ipDe(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "desconocida";
}

function estaBloqueada(ip: string): boolean {
  const ahora = Date.now();
  const e = intentosPorIp.get(ip);
  if (!e || ahora > e.resetAt) {
    intentosPorIp.set(ip, { count: 0, resetAt: ahora + VENTANA_MS });
    return false;
  }
  return e.count >= MAX_INTENTOS;
}

function registrarFallo(ip: string): void {
  const e = intentosPorIp.get(ip);
  if (e) e.count += 1;
}

/** POST { password } → setea cookie de sesión (7 días) si es correcta. */
export async function POST(req: NextRequest) {
  const ip = ipDe(req);
  if (estaBloqueada(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
      { status: 429 },
    );
  }

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
    registrarFallo(ip);
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }

  // Login correcto → limpiar el contador de esa IP.
  intentosPorIp.delete(ip);

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
