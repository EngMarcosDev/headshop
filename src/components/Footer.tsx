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

      <div className="footer-wood relative px-3 py-6 sm:px-4 md:py-8">
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-footer-foreground md:grid-cols-3 md:gap-x-8">
            {/* Coluna 1 — brand (full width no mobile pra ter destaque) */}
            <div className="col-span-2 text-center md:col-span-1 md:text-left">
              <h3 className="mb-2 text-lg font-display font-bold tracking-widest md:text-xl">ABACAXITA</h3>
              <p className="mx-auto max-w-[260px] text-xs leading-relaxed opacity-75 md:mx-0 md:text-sm">
                Sua loja de acessórios com os melhores produtos e preços do mercado.
              </p>
            </div>

            {/* Coluna 2 — Links */}
            <div className="text-left md:text-center">
              <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-rasta-yellow md:text-xs">Links</h4>
              <nav className="flex flex-col gap-1.5">
                <Link to="/" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Início</Link>
                <Link to="/produtos" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Produtos</Link>
                <Link to="/sobre" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Sobre nós</Link>
                <Link to="/contato" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Contato</Link>
              </nav>
            </div>

            {/* Coluna 3 — Contato */}
            <div className="text-left md:text-right">
              <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-rasta-yellow md:text-xs">Contato</h4>
              <div className="flex flex-col gap-1.5 text-xs opacity-75 md:text-sm">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-1.5 transition-all hover:text-rasta-yellow md:justify-end"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{CONTACT_EMAIL}</span>
                </a>
                <a
                  href={`tel:+${CONTACT_WHATSAPP_PHONE}`}
                  className="flex items-center gap-1.5 transition-all hover:text-rasta-yellow md:justify-end"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{CONTACT_WHATSAPP_DISPLAY}</span>
                </a>
              </div>

              <div className="mt-3 flex items-center gap-2 md:justify-end">
                <a
                  href={CONTACT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-instagram"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  Instagram
                </a>
                <a
                  href={CONTACT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-whatsapp"
                >
                  <MessageCircle className="h-3.5 w-3.5 fill-white" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4 text-center md:mt-6 md:pt-5">
            <p className="text-[10px] text-rasta-yellow md:text-xs">© 2026 Abacaxita. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
