import { FormEvent, useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const WHATSAPP_NUMBER = "5581981705445";

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const baseMessage = [
      "Oi, equipe Bacaxita! Vim pelo site e gostaria de atendimento.",
      name ? `Nome: ${name}` : "",
      email ? `Email: ${email}` : "",
      message ? `Mensagem: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const encoded = encodeURIComponent(baseMessage);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 md:grid-cols-2 md:py-12">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Contato</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Fale com a Bacaxita</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Atendimento rapido por WhatsApp para pedidos, duvidas, suporte e novidades.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <a
              href="https://wa.me/5581981705445"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-accent"
            >
              <MessageCircle className="h-4 w-4 text-accent" />
              <span>WhatsApp: (81) 98170-5445</span>
            </a>
            <a
              href="mailto:adm.bacaxita@gmail.com"
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-accent"
            >
              <Mail className="h-4 w-4 text-accent" />
              <span>Email: adm.bacaxita@gmail.com</span>
            </a>
            <a
              href="tel:+5581981705445"
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-accent"
            >
              <Phone className="h-4 w-4 text-accent" />
              <span>Telefone: (81) 98170-5445</span>
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">Envie sua mensagem</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Seu email"
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Digite sua mensagem"
              rows={6}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-rasta-green px-5 text-sm font-semibold text-white transition hover:bg-rasta-green/90"
            >
              Enviar no WhatsApp
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
