// Config del módulo de Servicios (Reparaciones y Mantenimiento).
// EDITABLE: Nicolás / Red Motos reemplaza marcas, modelos, precios de mantención
// y horario con los valores reales del taller.
//
// ⚠️ Los precios marcados son PLACEHOLDERS — actualizar con la tarifa real.

export type TipoServicio = "Mantenimiento" | "Reparación";

export interface ModeloServicio {
  modelo: string;
  /** Precio estimado de la mantención en CLP. */
  precioMantencion: number;
}

export interface MarcaServicio {
  marca: string;
  modelos: ModeloServicio[];
}

// PLACEHOLDER — reemplazar con las marcas/modelos que atiende el taller y su
// precio estimado de mantención preventiva.
export const MARCAS_SERVICIO: MarcaServicio[] = [
  {
    marca: "Royal Enfield",
    modelos: [
      { modelo: "Hunter 350", precioMantencion: 0 },
      { modelo: "Classic 350", precioMantencion: 0 },
      { modelo: "Meteor 350", precioMantencion: 0 },
      { modelo: "Super Meteor 650", precioMantencion: 0 },
      { modelo: "Otro modelo", precioMantencion: 0 },
    ],
  },
  {
    marca: "Suzuki",
    modelos: [
      { modelo: "GN 125", precioMantencion: 0 },
      { modelo: "GSX-R 1000R", precioMantencion: 0 },
      { modelo: "V-Strom 250", precioMantencion: 0 },
      { modelo: "Otro modelo", precioMantencion: 0 },
    ],
  },
  {
    marca: "Kymco",
    modelos: [{ modelo: "Otro modelo", precioMantencion: 0 }],
  },
  {
    marca: "Zonsen",
    modelos: [{ modelo: "Otro modelo", precioMantencion: 0 }],
  },
  {
    marca: "Cyclone",
    modelos: [{ modelo: "Otro modelo", precioMantencion: 0 }],
  },
  {
    marca: "Otra marca",
    modelos: [{ modelo: "No está en la lista", precioMantencion: 0 }],
  },
];

/** Devuelve el precio estimado de mantención (0 = sin tarifa cargada aún). */
export function precioMantencion(marca: string, modelo: string): number {
  const m = MARCAS_SERVICIO.find((x) => x.marca === marca);
  return m?.modelos.find((mm) => mm.modelo === modelo)?.precioMantencion ?? 0;
}

// ─── Disponibilidad / slots ──────────────────────────────────────────────────
// Horario del taller (debe coincidir con HORARIO de lib/config.ts).
// Slots por día de la semana (0=Domingo … 6=Sábado). Editar acá si cambia.
export const HORARIO_SLOTS: Record<number, string[]> = {
  0: [], // Domingo cerrado
  1: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  2: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  3: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  4: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  5: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  6: ["10:00", "11:00", "12:00", "13:00"], // Sábado
};

/** Cuántos días hacia adelante se pueden agendar. */
export const DIAS_AGENDABLES = 14;

export const TZ_SANTIAGO = "America/Santiago";

/** Día de la semana (0=Dom … 6=Sáb) de una fecha 'YYYY-MM-DD', sin desfase de TZ. */
export function diaSemanaDeFecha(fecha: string): number {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

/** Slots configurados para una fecha 'YYYY-MM-DD'. */
export function slotsDeFecha(fecha: string): string[] {
  return HORARIO_SLOTS[diaSemanaDeFecha(fecha)] ?? [];
}
