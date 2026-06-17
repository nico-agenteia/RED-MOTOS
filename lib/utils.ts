import type { LeadScore, Moto, Uso, Experiencia } from "./tipos";
import { CATALOGO, precioVigente } from "./catalogo";

/** Formato de precio chileno: 3499900 → "$3.499.900". */
export function formatCLP(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

/** Cuota mensual con sistema francés. Tasa mensual en decimal (0.019 = 1,9%). */
export function cuotaFrancesa(
  capital: number,
  tasaMensual: number,
  cuotas: number,
): number {
  if (capital <= 0 || cuotas <= 0) return 0;
  if (tasaMensual === 0) return capital / cuotas;
  const factor = Math.pow(1 + tasaMensual, cuotas);
  return (capital * tasaMensual * factor) / (factor - 1);
}

/** Inversa: dado un monto de cuota mensual, devuelve el capital máximo financiable. */
export function capitalDesdeQuota(
  cuotaMensual: number,
  tasaMensual: number,
  cuotas: number,
): number {
  if (cuotaMensual <= 0 || cuotas <= 0) return 0;
  if (tasaMensual === 0) return cuotaMensual * cuotas;
  const factor = Math.pow(1 + tasaMensual, cuotas);
  return (cuotaMensual * (factor - 1)) / (tasaMensual * factor);
}

export const RANGOS_PRESUPUESTO = [
  { etiqueta: "Hasta $2M", min: 0, max: 2_000_000 },
  { etiqueta: "$2M–$4M", min: 2_000_000, max: 4_000_000 },
  { etiqueta: "$4M–$7M", min: 4_000_000, max: 7_000_000 },
  { etiqueta: "+$7M", min: 7_000_000, max: Infinity },
] as const;

export function scoreLead(urgencia: string): LeadScore {
  if (urgencia === "Esta semana") return "hot";
  if (urgencia === "Este mes") return "warm";
  return "cold";
}

export const EMOJI_SCORE: Record<LeadScore, string> = {
  hot: "🔥",
  warm: "🟡",
  cold: "🧊",
};

/**
 * Recomendador local: filtra por presupuesto → uso → experiencia y devuelve
 * la mejor coincidencia del catálogo real.
 * // TODO: conectar con /api/recomendar (Claude Haiku) para recomendación IA real.
 */
export function recomendarMoto(
  presupuesto: string,
  uso: Uso,
  experiencia: Experiencia,
): Moto {
  const rango =
    RANGOS_PRESUPUESTO.find((r) => r.etiqueta === presupuesto) ??
    RANGOS_PRESUPUESTO[1];

  let candidatas = CATALOGO.filter((m) => {
    const p = precioVigente(m);
    return p >= rango.min && p <= rango.max;
  });
  if (candidatas.length === 0) {
    // Sin stock en el rango exacto: ofrecer lo más cercano por precio.
    candidatas = [...CATALOGO].sort(
      (a, b) =>
        Math.abs(precioVigente(a) - rango.max) -
        Math.abs(precioVigente(b) - rango.max),
    );
  }

  const porUso = candidatas.filter((m) => m.usos.includes(uso));
  if (porUso.length > 0) candidatas = porUso;

  if (experiencia === "Primera moto") {
    const aptas = candidatas.filter((m) => m.aptaPrincipiante);
    if (aptas.length > 0) candidatas = aptas;
  } else if (experiencia === "Experimentado") {
    // Los experimentados aprecian la mayor cilindrada del rango.
    candidatas = [...candidatas].sort((a, b) => b.cc - a.cc);
  }

  // Desempate: la de mayor precio dentro del presupuesto (mejor moto posible).
  return [...candidatas].sort(
    (a, b) => precioVigente(b) - precioVigente(a),
  )[0];
}
