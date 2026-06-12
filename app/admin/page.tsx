import type { Metadata } from "next";
import LoginGate from "@/components/admin/LoginGate";

export const metadata: Metadata = {
  title: "Panel Admin · Red Motos",
  robots: { index: false, follow: false },
};

// En export estático no hay server runtime: el LoginGate maneja auth en cliente.
export default function AdminPage() {
  return <LoginGate />;
}
