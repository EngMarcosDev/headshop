import { useEffect, useRef, useState } from "react";
import { Instagram, MessageCircle, X } from "lucide-react";
import { CONTACT_INSTAGRAM_URL, CONTACT_WHATSAPP_URL } from "@/lib/socialLinks";

type SocialId = "whatsapp" | "instagram";

type SocialTarget = {
  id: SocialId;
  label: string;
  href: string;
  gradient: string;
  icon: JSX.Element;
};

const SOCIALS: SocialTarget[] = [
  {
    id: "whatsapp",
    label: "Fale no WhatsApp",
    href: CONTACT_WHATSAPP_URL,
    gradient: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    icon: <MessageCircle className="h-7 w-7 fill-white text-white" />,
  },
  {
    id: "instagram",
    label: "Abrir Instagram",
    href: CONTACT_INSTAGRAM_URL,
    gradient: "linear-gradient(135deg, #405de6 0%, #c13584 45%, #fd1d1d 70%, #ffdc80 100%)",
    icon: <Instagram className="h-7 w-7 text-white" />,
  },
];

const DISPLAY_PHASE_MS = 4200;
const FADE_SWITCH_MS = 900;
const HOLD_PHASE_MS = 1700;

interface WhatsAppFloatProps {
  visible?: boolean;
}

const WhatsAppFloat = ({ visible = true }: WhatsAppFloatProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [firstLoopDone, setFirstLoopDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const firstLoopRef = useRef(false);

  useEffect(() => {
    if (dismissed) return;

    const timers: number[] = [];
    const runLoop = () => {
      const displayTimer = window.setTimeout(() => {
        setIsSwitching(true);

        const switchTimer = window.setTimeout(() => {
          setActiveIndex((current) => {
            const next = (current + 1) % SOCIALS.length;
            if (!firstLoopRef.current && current === SOCIALS.length - 1) {
              firstLoopRef.current = true;
              setFirstLoopDone(true);
            }
            return next;
          });
          setIsSwitching(false);

          const holdTimer = window.setTimeout(() => {
            runLoop();
          }, HOLD_PHASE_MS);
          timers.push(holdTimer);
        }, FADE_SWITCH_MS);
        timers.push(switchTimer);
      }, DISPLAY_PHASE_MS);
      timers.push(displayTimer);
    };

    runLoop();
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismissed]);

  if (dismissed) return null;

  const activeSocial = SOCIALS[activeIndex];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      } transition-all duration-700`}
    >
      <a
        key={activeSocial.id}
        href={activeSocial.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={activeSocial.label}
        title={activeSocial.label}
        className={`social-float-breathe flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-all duration-900 hover:scale-110 hover:shadow-xl sm:h-14 sm:w-14 ${
          isSwitching ? "scale-[0.96] opacity-50" : "scale-100 opacity-100"
        }`}
        style={{ background: activeSocial.gradient }}
      >
        {activeSocial.icon}
      </a>

      {firstLoopDone ? (
        <button
          type="button"
          aria-label="Fechar atalhos sociais"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDismissed(true);
          }}
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-black/65 text-white transition hover:bg-black/80"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
};

export default WhatsAppFloat;
