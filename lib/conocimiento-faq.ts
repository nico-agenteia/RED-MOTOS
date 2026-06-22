// Base de conocimiento del asistente conversacional (Recomendador IA).
// EDITABLE: Nicolás / Red Motos corrige estas respuestas con la info real del
// negocio. El agente Claude responde SOLO con esto + el catálogo + lib/config.ts.
// Si un tema no está acá, el agente deriva al WhatsApp en vez de inventar.
//
// ⚠️ Los valores marcados como [PENDIENTE] son placeholders razonables —
// reemplazar con la política real antes de producción.

export interface BloqueFAQ {
  tema: string;
  contenido: string;
}

export const CONOCIMIENTO_FAQ: BloqueFAQ[] = [
  {
    tema: "Marcas y punto oficial",
    contenido:
      "Red Motos es concesionaria multimarca. Marcas oficiales en el catálogo: " +
      "Royal Enfield (somos PUNTO OFICIAL Royal Enfield), Suzuki, Kymco, Zonsen y Cyclone. " +
      "Todas las motos son nuevas, 0 km, con factura y garantía oficial de la marca.",
  },
  {
    tema: "Garantía",
    contenido:
      "[PENDIENTE: confirmar] Todas las motos nuevas incluyen la garantía oficial del " +
      "fabricante. La cobertura y duración dependen de la marca y del cumplimiento de las " +
      "mantenciones en el plazo indicado. Para el detalle exacto de tu modelo, lo confirmamos " +
      "por WhatsApp.",
  },
  {
    tema: "Formas de pago y financiamiento",
    contenido:
      "Aceptamos pago contado (efectivo/transferencia) y financiamiento en cuotas. " +
      "Trabajamos con financiamiento a través de Autofin: se evalúa al cliente y se arma un " +
      "plan con pie y plazo. El sitio tiene un simulador de cuotas referencial, pero las " +
      "condiciones finales (tasa, CAE, pie) siempre las define la evaluación crediticia. " +
      "Para cotizar tu crédito real, dejá tus datos y un vendedor te contacta.",
  },
  {
    tema: "Permuta / parte de pago",
    contenido:
      "[PENDIENTE: confirmar] Recibimos tu moto usada en parte de pago. La tasación depende " +
      "del modelo, año y estado. Para tasar tu moto necesitamos los datos y, idealmente, fotos " +
      "por WhatsApp.",
  },
  {
    tema: "Despacho y retiro",
    contenido:
      "[PENDIENTE: confirmar] El retiro se coordina en la casa matriz (Av. Vicuña Mackenna " +
      "8264, La Florida) o sucursales. Consultá disponibilidad de despacho a regiones por WhatsApp.",
  },
  {
    tema: "Patentamiento y documentación",
    contenido:
      "[PENDIENTE: confirmar] Te entregamos la moto con factura. El trámite de inscripción y " +
      "patente se coordina al momento de la compra; consultá costos y tiempos con el vendedor.",
  },
  {
    tema: "Test ride / probar la moto",
    contenido:
      "[PENDIENTE: confirmar] Para ver y conocer las motos en persona, te esperamos en la " +
      "casa matriz o sucursales en el horario de atención.",
  },
  {
    tema: "Sucursales y horario",
    contenido:
      "Casa Matriz: Av. Vicuña Mackenna 8264, La Florida. También sucursales en La Florida y " +
      "La Cisterna. Horario: Lun–Vie 9:00–19:00 · Sáb 10:00–14:00.",
  },
  {
    tema: "Servicio técnico / mantención",
    contenido:
      "[PENDIENTE: confirmar] Ofrecemos servicio de mantención y reparación. Para agendar, " +
      "pronto vas a poder hacerlo desde la sección de Servicios del sitio. Mientras tanto, " +
      "coordiná por WhatsApp.",
  },
];

/** Render del conocimiento como texto plano para el system prompt. */
export function conocimientoComoTexto(): string {
  return CONOCIMIENTO_FAQ.map((b) => `### ${b.tema}\n${b.contenido}`).join("\n\n");
}
