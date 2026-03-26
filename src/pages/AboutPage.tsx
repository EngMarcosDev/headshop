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

          <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-start">
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                A nossa historia e quase uma lenda urbana: um casal rebelde sobrevive em um mundo pos-explosao
                radioativa que gerou apenas anomalias cerebrais.
              </p>
              <p>
                Nessa loucura toda, a Bacaxita ganhou o poder de curar atraves do olhar, enquanto o Bacaxito ganhou o
                poder de criar atraves do pensamento.
              </p>
              <p>
                Juntos, os dois vivem fugindo da Organizacao dos Porcos Malvados, que faz de tudo para destruir a
                plantacao de abacaxis lombrosos.
              </p>
              <p>
                A marca nasceu desse universo: criativa, irreverente, com produtos pensados para quem quer autenticidade
                e uma experiencia divertida de ponta a ponta.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <img
                src="/assets/branding/Quadrinhos.png"
                alt="Abacaxi em quadrinhos"
                className="h-full w-full rounded-lg object-cover"
              />
              <p className="mt-2 text-xs text-muted-foreground">Abacaxi em quadrinhos oficial da tripulacao Bacaxita.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
