"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [shake, setShake] = useState(0);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const datos = await res.json().catch(() => null);
      setError(datos?.error ?? "No se pudo iniciar sesión");
      setShake((s) => s + 1);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setShake((s) => s + 1);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black px-4">
      <motion.form
        key={shake}
        onSubmit={entrar}
        initial={false}
        animate={shake > 0 ? { x: [0, -8, 8, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-8"
      >
        <p className="font-display text-2xl font-extrabold uppercase tracking-wide text-white">
          Red Motos<span className="text-red-500">.</span>
        </p>
        <p className="label-mono mt-1 !text-[11px]">Panel de administración</p>

        <label className="mt-8 flex flex-col gap-2">
          <span className="text-sm font-medium text-white">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
            className={`min-h-[48px] rounded-md border bg-surface-2 px-4 text-sm text-white focus:outline-none ${
              error
                ? "border-red-500"
                : "border-line focus:border-red-500"
            }`}
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={cargando || password.length === 0}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-red-500 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {cargando ? "Verificando…" : "Entrar"}
        </motion.button>
      </motion.form>
    </main>
  );
}
