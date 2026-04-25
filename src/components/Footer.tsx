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

      <div className="footer-wood relative px-4 py-6 sm:px-5 md:py-8">
        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Mobile: 1 coluna full-width (cada bloco com sua largura, sem estourar pills).
              md+: 3 colunas. */}
          <div className="grid grid-cols-1 gap-y-5 text-footer-foreground sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-x-8 md:gap-y-6">
            {/* Coluna 1 — brand */}
            <div className="text-center sm:col-span-2 md:col-span-1 md:text-left">
              <h3 className="mb-2 text-lg font-display font-bold tracking-widest md:text-xl">ABACAXITA</h3>
              <p className="mx-auto max-w-[260px] text-xs leading-relaxed opacity-75 md:mx-0 md:text-sm">
                Sua loja de acessórios com os melhores produtos e preços do mercado.
              </p>
            </div>

            {/* Coluna 2 — Links */}
            <div className="text-center sm:text-left md:text-center">
              <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-rasta-yellow md:text-xs">Links</h4>
              <nav className="flex flex-col gap-1.5">
                <Link to="/" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Início</Link>
                <Link to="/produtos" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Produtos</Link>
                <Link to="/sobre" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Sobre nós</Link>
                <Link to="/contato" className="text-xs opacity-75 transition-all hover:text-rasta-yellow hover:opacity-100 md:text-sm">Contato</Link>
              </nav>
            </div>

            {/* Coluna 3 — Contato */}
            <div className="text-center sm:text-right md:text-right">
              <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-rasta-yellow md:text-xs">Contato</h4>
              <div className="flex flex-col gap-1.5 text-xs opacity-75 md:text-sm">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center justify-center gap-1.5 transition-all hover:text-rasta-yellow sm:justify-end"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{CONTACT_EMAIL}</span>
                </a>
                <a
                  href={`tel:+${CONTACT_WHATSAPP_PHONE}`}
                  className="flex items-center justify-center gap-1.5 transition-all hover:text-rasta-yellow sm:justify-end"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{CONTACT_WHATSAPP_DISPLAY}</span>
                </a>
              </div>

              {/* Pills com flex-wrap pra nunca estourar a coluna (era o bug do WhatsApp pra fora). */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-end sm:gap-2">
                <a
                  href={CONTACT_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-instagram px-2 py-1 text-[11px] sm:px-3 sm:text-xs"
                >
                  <Instagram className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Instagram
                </a>
                <a
                  href={CONTACT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-whatsapp px-2 py-1 text-[11px] sm:px-3 sm:text-xs"
                >
                  <MessageCircle className="h-3 w-3 fill-white sm:h-3.5 sm:w-3.5" />
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
