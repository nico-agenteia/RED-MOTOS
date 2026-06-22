// Tipos compartidos del catálogo y el panel admin.

export type Marca =
  | "Royal Enfield"
  | "Suzuki"
  | "Kymco"
  | "Zonsen"
  | "Cyclone";

export type Segmento =
  | "Urbana"
  | "Deportiva"
  | "Adventure"
  | "Off-road"
  | "Cruiser"
  | "Scrambler"
  | "Custom"
  | "Scooter"
  | "Naked"
  | "Touring"
  | "Motocross"
  | "ATV"
  | "UTV";

export type Uso = "Ciudad" | "Ruta" | "Off-road" | "Trabajo" | "Placer";

export type Experiencia =
  | "Primera moto"
  | "Algo de experiencia"
  | "Experimentado";

export interface Moto {
  id: string;
  marca: Marca;
  modelo: string;
  segmento: Segmento;
  /** Cilindrada en cc. */
  cc: number;
  /** Precio de lista en CLP. */
  precioLista: number;
  /** Precio final en CLP si hay bono vigente; null si no hay. */
  precioBono: number | null;
  /** Fecha de vencimiento del bono (ISO string); null si no aplica. */
  bonoVence: string | null;
  /** URL de la imagen de producto (Storage o /public). */
  img: string;
  usos: Uso[];
  aptaPrincipiante: boolean;
  /** Aparece en el carrusel ShowcasePremium. */
  destacado: boolean;
  /** Orden manual en el catálogo (menor = primero). */
  orden: number;
  /** Moto marcada como sin stock por el admin. */
  sinStock: boolean;
}

export interface LeadRecomendador {
  nombre: string;
  whatsapp: string;
  presupuesto: string;
  uso: Uso;
  experiencia: Experiencia;
  urgencia: "Esta semana" | "Este mes" | "En 3 meses" | "Solo mirando";
}

/** Solicitud de financiamiento recibida desde los webhooks de Autofin (Araña). */
export interface SolicitudAutofin {
  id: string;
  idTrinidad: number | null;
  leadId: string | null;
  estadoEvaluacion: string | null;
  estadoTrinidad: string | null;
  codEstado: number | null;
  resolucion: string | null;
  producto: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  precio: number | null;
  pie: number | null;
  plazo: number | null;
  valorCuota: number | null;
  cae: string | null;
  nombre: string | null;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  atendido: boolean;
  creadoEn: string;
}

/** Cita de servicio (Reparación o Mantenimiento) agendada desde el sitio. */
export interface Cita {
  id: string;
  tipo: string; // "Mantenimiento" | "Reparación"
  nombre: string;
  whatsapp: string;
  email: string | null;
  marca: string | null;
  modelo: string | null;
  descripcion: string | null;
  precioEstimado: number | null;
  fecha: string | null; // "YYYY-MM-DD"; null si solo dejó datos
  hora: string | null; // "HH:MM"
  estado: string; // pendiente|confirmada|cancelada|completada
  atendido: boolean;
  creadoEn: string;
}

/** Venta 0 km para el CRM de seguimiento de mantenciones. */
export interface VentaPostventa {
  id: string;
  nombre: string;
  whatsapp: string;
  email: string | null;
  marca: string | null;
  modelo: string | null;
  patente: string | null;
  fechaCompra: string; // "YYYY-MM-DD"
  vendedor: string | null;
  notas: string | null;
  hito1m: boolean;
  hito4m: boolean;
  hito8m: boolean;
  hito12m: boolean;
  creadoEn: string;
}

/** Entrega co-brandeada para la sección pública "Nuestros Clientes". */
export interface ClienteFeliz {
  id: string;
  imgUrl: string;
  nombre: string | null;
  marca: string | null;
  modelo: string | null;
  orden: number;
  activo: boolean;
}

export type LeadScore = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  origen: "recomendador" | "simulador" | "contacto" | "popup" | "servicio";
  nombre?: string;
  whatsapp?: string;
  presupuesto?: string;
  uso?: string;
  experiencia?: string;
  urgencia?: string;
  score?: LeadScore;
  payload?: Record<string, unknown>;
  atendido: boolean;
  creadoEn: string;
}
