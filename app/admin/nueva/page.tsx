import type { Metadata } from "next";
import LoginGate from "@/components/admin/LoginGate";

export const metadata: Metadata = {
  title: "Nueva moto · Panel Admin · Red Motos",
  robots: { index: false, follow: false },
};

export default function NuevaMotoPage() {
  return <LoginGate />;
}
