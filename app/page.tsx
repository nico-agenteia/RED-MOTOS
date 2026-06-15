import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ShowcasePremium from "@/components/ShowcasePremium";
import GiroBeneficios from "@/components/GiroBeneficios";
import Marcas from "@/components/Marcas";
import Catalogo from "@/components/Catalogo";
import SalaRoyalEnfield from "@/components/SalaRoyalEnfield";
import SalaSuzuki from "@/components/SalaSuzuki";
import RecomendadorIA from "@/components/RecomendadorIA";
import SimuladorCuotas from "@/components/SimuladorCuotas";
import Clientes from "@/components/Clientes";
import Beneficios from "@/components/Beneficios";
import Contacto from "@/components/Contacto";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getMotos } from "@/lib/motos-data";

// ISR: regenera cada 5 minutos. El admin dispara revalidación on-demand
// al guardar/editar/eliminar motos, así los cambios se publican al instante.
export const revalidate = 300;

export default async function Home() {
  const motos = await getMotos();

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
        <SimuladorCuotas />
        <Clientes />
        <Beneficios />
        <Contacto />
      </main>
      <WhatsAppFloat />
    </>
  );
}
