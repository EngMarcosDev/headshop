import { Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-auto">
      <div className="rasta-stripe" />

      <div className="footer-wood py-8 md:py-12 px-4 relative">
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-footer-foreground">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-display font-bold tracking-widest mb-3">ABACAXITA</h3>
              <p className="text-sm opacity-75 leading-relaxed max-w-xs mx-auto md:mx-0">
                Sua loja de acessorios com os melhores produtos e precos do mercado.
              </p>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-4 text-rasta-yellow text-sm uppercase tracking-wider">Links Rapidos</h4>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={scrollToTop}
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Inicio
                </button>
                <Link
                  to="/produtos"
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Produtos
                </Link>
                <Link
                  to="/sobre"
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Sobre nos
                </Link>
                <Link
                  to="/contato"
                  className="text-sm opacity-75 hover:opacity-100 hover:text-rasta-yellow transition-all"
                >
                  Contato
                </Link>
              </nav>
            </div>

            <div className="text-center md:text-right">
              <h4 className="font-semibold mb-4 text-rasta-yellow text-sm uppercase tracking-wider">Contato</h4>
              <div className="flex flex-col gap-2 text-sm opacity-75">
                <a
                  href="mailto:adm.bacaxita@gmail.com"
                  className="flex items-center justify-center md:justify-end gap-2 hover:text-rasta-yellow transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>adm.bacaxita@gmail.com</span>
                </a>
                <a
                  href="tel:+5581981705445"
                  className="flex items-center justify-center md:justify-end gap-2 hover:text-rasta-yellow transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>(81) 98170-5445</span>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-end">
                <a
                  href="https://instagram.com/bacaxita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill-instagram"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
                <a
                  href="https://wa.me/5581981705445"
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

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-rasta-yellow">© 2026 Abacaxita. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
