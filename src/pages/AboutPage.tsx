import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AboutPage = () => {
  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-12">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Sobre nos</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">Bacaxita x Lombroso</h1>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              Bacaxita nasceu com a proposta de oferecer uma experiencia diferenciada no universo headshop, unindo
              estilo, qualidade e atitude.
            </p>
            <p>
              Inspirada na identidade Lombroso, a marca carrega personalidade forte, autenticidade e inovacao em cada
              detalhe.
            </p>
            <p>
              Mais do que produtos, entregamos uma vivencia para quem valoriza cultura, liberdade e originalidade.
            </p>
            <p>
              Nossa missao e conectar pessoas a uma curadoria que respeita a cena, o lifestyle e o cuidado em cada
              compra.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
