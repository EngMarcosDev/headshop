import { Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import {
  CONTACT_EMAIL,
  CONTACT_INSTAGRAM_URL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_PHONE,
  CONTACT_WHATSAPP_URL,
} from "@/lib/socialLinks";

const Footer = () => {
  return (
    <footer className="mt-auto">
      <div className="rasta-stripe" />

      <div className="footer-wood relative px-4 py-8 md:py-12">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 text-footer-foreground md:grid-cols-3">
            <div className="text-center md:text-left">
              <h3 className="mb-3 text-xl font-display font-bold tracking-widest md:text-2xl">ABACAXITA</h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed opacity-75 md:mx-0">
                Sua loja de acessorios com os melhores produtos e precos do mercado.
              </p>
            </div>

            <div className="text-center">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-rasta-yellow">Links Rapidos</h4>
              <nav className="flex flex-col gap-2">
                <Link to="/" className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100">
                  Inicio
                </Link>
                <Link
                  to="/produtos"
                  className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100"
                >
                  Produtos
                </Link>
                <Link
                  to="/sobre"
                  className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100"
                >
                  Sobre nos
                </Link>
                <Link
                  to="/contato"
                  className="text-sm opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100"
                >
                  Contato
                </Link>
              </nav>
            </div>

            <div className="text-center md:text-right">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-rasta-yellow">Contato</h4>
              <div className="flex flex-col gap-2 text-sm opacity-75">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center justify-center gap-2 transition-all hover:text-rasta-yellow md:justify-end"
                >
                  <Mail className="h-4 w-4" />
                  <span>{CONTACT_EMAIL}</span>
                </a>
                <a
                  href={`tel:+${CONTACT_WHATSAPP_PHONE}`}
                  className="flex items-center justify-center gap-2 transition-all hover:text-rasta-yellow md:justify-end"
                >
                  <Phone className="h-4 w-4" />
                  <span>{CONTACT_WHATSAPP_DISPLAY}</span>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-end">
                <a
                  href={CONTACT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-instagram"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
                <a
                  href={CONTACT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-whatsapp"
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-rasta-yellow">© 2026 Abacaxita. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
