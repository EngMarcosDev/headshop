import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Sobre nos</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">Bacaxita HeadShop</h1>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              A Bacaxita nasceu para oferecer uma experiencia moderna no universo headshop, unindo curadoria
              inteligente, qualidade real e atendimento de verdade.
            </p>
            <p>
              Trabalhamos com foco em autenticidade, confianca e evolucao continua, sempre buscando produtos que
              entreguem desempenho, estilo e consistencia para o seu dia a dia.
            </p>
            <p>
              Mais do que vender itens, queremos construir uma vivencia completa: compra simples, suporte humano e uma
              marca que respeita a cultura de quem vive esse mercado.
            </p>
            <p>
              Nosso compromisso e claro: manter um catalogo confiavel, entrega transparente e comunicacao objetiva em
              cada etapa da jornada.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
