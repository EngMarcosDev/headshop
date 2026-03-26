import { FormEvent, useState } from "react";
import { ArrowLeft, Instagram, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  CONTACT_EMAIL,
  CONTACT_INSTAGRAM_URL,
  CONTACT_WHATSAPP_URL,
} from "@/lib/socialLinks";

const ContactPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent("Contato pelo site Abacaxita");
    const body = encodeURIComponent([
      "Oi, equipe Abacaxita! Vim pelo site e gostaria de atendimento por email.",
      name ? `Nome: ${name}` : "",
      email ? `Email: ${email}` : "",
      message ? `Mensagem: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n"));

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 md:grid-cols-2 md:py-12">
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Contato</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Fale com a Abacaxita</h1>
          <div className="mt-6 grid gap-3 text-sm">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-accent"
            >
              <Mail className="h-4 w-4 text-accent" />
              <span>Email: {CONTACT_EMAIL}</span>
            </a>
            <a
              href={CONTACT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-accent"
            >
              <MessageCircle className="h-4 w-4 text-accent" />
              <span>WhatsApp</span>
            </a>
            <a
              href={CONTACT_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition hover:border-accent"
            >
              <Instagram className="h-4 w-4 text-accent" />
              <span>Instagram</span>
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
              Enviar por email
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
