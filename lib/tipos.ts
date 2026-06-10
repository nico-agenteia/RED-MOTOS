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
  /** Cilindrada en cc — derivada del nombre del modelo. */
  cc: number;
  /** Precio de lista en CLP. */
  precioLista: number;
  /** Precio final en CLP si hay bono/descuento vigente; null si no hay. */
  precioBono: number | null;
  /** Ruta de la foto de producto en /public. */
  img: string;
  /** Usos recomendados — alimenta al Recomendador IA. */
  usos: Uso[];
  /** Apta para primera moto. */
  aptaPrincipiante: boolean;
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
