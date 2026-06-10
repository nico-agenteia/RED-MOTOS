import { createHash } from "node:crypto";

export const COOKIE_SESION = "rm_admin_sesion";
export const DURACION_SESION_DIAS = 7;

/**
 * Token de sesión derivado de ADMIN_PASSWORD. Si la contraseña cambia,
 * todas las sesiones anteriores quedan inválidas automáticamente.
 */
export function tokenSesion(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256")
    .update(`redmotos-admin::${password}`)
    .digest("hex");
}

export function esSesionValida(valorCookie: string | undefined): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  return valorCookie === tokenSesion();
}

export function esPasswordValida(password: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  return Boolean(esperada) && password === esperada;
}
