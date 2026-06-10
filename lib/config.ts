// ⭐ ÚNICA FUENTE DE VERDAD de marca y contacto de Red Motos Chile.
// Todo componente, metadata y prompt lee de aquí — nunca hardcodear estos
// datos en otro archivo.

export const NEGOCIO = {
  nombre: "Red Motos",
  nombreLargo: "Red Motos Chile",
  claim: "Concesionario multimarca en Santiago",
  email: "ventas@redmotos.cl",
  whatsapp: "+56 9 7453 3616",
  whatsappRaw: "56974533616",
  instagram: "@redmotoschile",
  instagramUrl: "https://www.instagram.com/redmotoschile",
  web: "https://www.redmotos.cl",
} as const;

export const SUCURSALES = [
  {
    nombre: "Casa Matriz",
    direccion: "Av. Vicuña Mackenna 8264, La Florida",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Av.+Vicu%C3%B1a+Mackenna+8264%2C+La+Florida%2C+Santiago",
    esMatriz: true,
  },
  {
    nombre: "Sucursal La Florida",
    direccion: "La Florida, Santiago",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Red+Motos+La+Florida+Santiago",
    esMatriz: false,
  },
  {
    nombre: "Sucursal La Cisterna",
    direccion: "La Cisterna, Santiago",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Red+Motos+La+Cisterna+Santiago",
    esMatriz: false,
  },
] as const;

export const HORARIO = {
  semana: "Lun–Vie 9:00–19:00",
  sabado: "Sáb 10:00–14:00",
  completo: "LUN–VIE 9:00–19:00 · SÁB 10:00–14:00",
} as const;

// Tasa mensual REFERENCIAL del simulador de cuotas (sistema francés).
// Las condiciones finales SIEMPRE las define la tienda.
export const TASA_MENSUAL_REFERENCIAL = 0.019;

/** Construye un deep-link de WhatsApp con mensaje pre-cargado. */
export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${NEGOCIO.whatsappRaw}?text=${encodeURIComponent(mensaje)}`;
}

export const MENSAJE_WSP_GENERICO =
  "Hola! Vengo de la web de Red Motos y quiero cotizar una moto. ¿Me pueden atender?";
