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

      {/* Acceso admin — discreto, solo para uso interno */}
      <div className="flex justify-center py-6">
        <a
          href="/admin"
          className="flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-xs text-white/25 transition-colors duration-200 hover:border-white/20 hover:text-white/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Admin
        </a>
      </div>
    </>
  );
}
