import { useEffect, useState } from "react";
import { Instagram, MessageCircle } from "lucide-react";

type SocialTarget = {
  id: "whatsapp" | "instagram";
  label: string;
  href: string;
  gradient: string;
  icon: JSX.Element;
};

const SOCIALS: SocialTarget[] = [
  {
    id: "instagram",
    label: "Abrir Instagram",
    href: "https://instagram.com/bacaxita",
    gradient: "linear-gradient(135deg, #405de6 0%, #c13584 45%, #fd1d1d 70%, #ffdc80 100%)",
    icon: <Instagram className="h-7 w-7 text-white" />,
  },
  {
    id: "whatsapp",
    label: "Fale no WhatsApp",
    href: "https://wa.me/5581981705445",
    gradient: "linear-gradient(135deg, #25D366, #128C7E)",
    icon: <MessageCircle className="h-7 w-7 fill-white text-white" />,
  },
];

interface WhatsAppFloatProps {
  visible?: boolean;
}

const WhatsAppFloat = ({ visible = true }: WhatsAppFloatProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SOCIALS.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const activeSocial = SOCIALS[activeIndex];

  return (
    <a
      href={activeSocial.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={activeSocial.label}
      className={`fixed bottom-4 right-4 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-xl sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      style={{ background: activeSocial.gradient }}
    >
      {activeSocial.icon}
    </a>
  );
};

export default WhatsAppFloat;
