import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ShowcasePremium from "@/components/ShowcasePremium";
import GiroBeneficios from "@/components/GiroBeneficios";
import Marcas from "@/components/Marcas";
import Catalogo from "@/components/Catalogo";
import SalaRoyalEnfield from "@/components/SalaRoyalEnfield";
import SalaSuzuki from "@/components/SalaSuzuki";
import RecomendadorIA from "@/components/RecomendadorIA";
import BuscadorPorCuota from "@/components/BuscadorPorCuota";
import SimuladorCuotas from "@/components/SimuladorCuotas";
import Servicios from "@/components/Servicios";
import Nosotros from "@/components/Nosotros";
import Clientes from "@/components/Clientes";
import Beneficios from "@/components/Beneficios";
import Contacto from "@/components/Contacto";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import PopupBienvenida from "@/components/PopupBienvenida";
import { getMotos } from "@/lib/motos-data";
import { getClientesFelices } from "@/lib/clientes-felices-data";

// ISR: regenera cada 5 minutos. El admin dispara revalidación on-demand
// al guardar/editar/eliminar motos, así los cambios se publican al instante.
export const revalidate = 300;

export default async function Home() {
  const [motos, clientesFelices] = await Promise.all([
    getMotos(),
    getClientesFelices(),
  ]);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ShowcasePremium />
        <GiroBeneficios />
        <SalaRoyalEnfield />
        <SalaSuzuki />
        <Catalogo motos={motos} />
        <Marcas />
        <RecomendadorIA />
        <BuscadorPorCuota />
        <SimuladorCuotas />
        <Servicios />
        <Nosotros />
        <Clientes fotos={clientesFelices} />
        <Beneficios />
        <Contacto />
      </main>
      <WhatsAppFloat />
      <PopupBienvenida />
    </>
  );
}
