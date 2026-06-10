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

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ShowcasePremium />
        <GiroBeneficios />
        <Marcas />
        <Catalogo />
        <SalaRoyalEnfield />
        <SalaSuzuki />
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
