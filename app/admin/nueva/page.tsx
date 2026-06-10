import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import LoginGate from "@/components/admin/LoginGate";
import NuevaMoto from "@/components/admin/NuevaMoto";

export const metadata: Metadata = {
  title: "Nueva moto · Panel Admin · Red Motos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NuevaMotoPage() {
  const sesion = cookies().get(COOKIE_SESION)?.value;

  if (!esSesionValida(sesion)) {
    return <LoginGate />;
  }

  return <NuevaMoto />;
}
