"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MotoForm from "./MotoForm";
import EstudioFotos from "./EstudioFotos";

/**
 * Flujo de alta rápida: el dueño llega con la moto nueva, sube la foto al
 * Estudio de Fotos y luego la registra en el catálogo con el formulario.
 */
export default function NuevaMoto() {
  const [formAbierto, setFormAbierto] = useState(false);
  const [guardadas, setGuardadas] = useState(0);

  return (
    <div className="min-h-dvh bg-black">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
        <div>
          <h1 className="font-display text-xl font-bold uppercase text-white">
            Nueva moto
          </h1>
          <p className="label-mono mt-1 !text-[10px]">
            Foto con IA → alta al catálogo
          </p>
        </div>
        <a
          href="/admin"
          className="inline-flex min-h-[44px] items-center rounded-md border border-line px-4 text-sm font-medium text-muted transition-colors duration-200 hover:border-white/25 hover:text-white"
        >
          ← Volver al panel
        </a>
      </header>

      <main className="mx-auto max-w-5xl p-6 md:p-8">
        <EstudioFotos />

        <div className="mt-12 rounded-xl border border-line bg-surface p-6">
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Registrar en el catálogo
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Cuando tengas la foto lista, registra la moto con su precio para
            que aparezca de inmediato en el sitio.
          </p>
          {guardadas > 0 && (
            <p className="mt-3 text-sm font-medium text-wsp">
              ✓ {guardadas} moto{guardadas > 1 ? "s" : ""} agregada
              {guardadas > 1 ? "s" : ""} en esta sesión
            </p>
          )}
          <motion.button
            type="button"
            onClick={() => setFormAbierto(true)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mt-5 inline-flex min-h-[48px] items-center rounded-md bg-red-500 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-600"
          >
            + Agregar Moto
          </motion.button>
        </div>
      </main>

      <MotoForm
        abierto={formAbierto}
        onCerrar={() => setFormAbierto(false)}
        onGuardada={() => setGuardadas((n) => n + 1)}
      />
    </div>
  );
}
