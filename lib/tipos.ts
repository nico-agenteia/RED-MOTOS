// Tipos compartidos del catálogo y el panel admin.

export type Marca =
  | "Royal Enfield"
  | "Suzuki"
  | "Kymco"
  | "Keeway"
  | "Zontes"
  | "Voge"
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
  | "Naked";

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
}

export interface LeadRecomendador {
  nombre: string;
  whatsapp: string;
  presupuesto: string;
  uso: Uso;
  experiencia: Experiencia;
  urgencia: "Esta semana" | "Este mes" | "En 3 meses" | "Solo mirando";
}

export type LeadScore = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  origen: "recomendador" | "simulador" | "contacto";
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
