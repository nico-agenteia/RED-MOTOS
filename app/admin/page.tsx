import type { Metadata } from "next";
import { cookies } from "next/headers";
import { COOKIE_SESION, esSesionValida } from "@/lib/auth";
import LoginGate from "@/components/admin/LoginGate";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Panel Admin · Red Motos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const sesion = cookies().get(COOKIE_SESION)?.value;

  if (!esSesionValida(sesion)) {
    return <LoginGate />;
  }

  return <AdminDashboard />;
}
