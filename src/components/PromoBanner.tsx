import { useEffect, useState } from "react";
import { Leaf, Tag, Truck } from "lucide-react";

const banners = [
  {
    id: 1,
    bg: "bg-rasta-green",
    text: "Tenha uma boa Sesh!",
    textColor: "text-white",
    icon: Leaf,
  },
  {
    id: 2,
    bg: "bg-rasta-yellow",
    text: "Entregas rastreaveis.",
    textColor: "text-primary",
    icon: Truck,
  },
  {
    id: 3,
    bg: "bg-rasta-red",
    text: "Consulte nossas promocoes.",
    textColor: "text-white",
    icon: Tag,
  },
];

const SLIDE_DURATION_MS = 3330;
const TRANSITION_MS = 1000;

const PromoBanner = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const extended = [...banners, banners[0]];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCurrent((prev) => prev + 1);
      setIsTransitioning(true);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [current]);

  return (
    <section className="relative h-10 w-full overflow-hidden sm:h-9">
      <div
        className={`flex h-full ${isTransitioning ? "transition-transform ease-in-out" : ""}`}
        style={{
          transform: `translateX(-${current * 100}%)`,
          transitionDuration: isTransitioning ? `${TRANSITION_MS}ms` : "0ms",
        }}
        onTransitionEnd={() => {
          if (current === banners.length) {
            setIsTransitioning(false);
            setCurrent(0);
            window.dispatchEvent(new CustomEvent("bacaxita:promo-loop"));
            window.setTimeout(() => setIsTransitioning(true), 30);
          }
        }}
      >
        {extended.map((banner, i) => (
          <div
            key={`${banner.id}-${i}`}
            className={`h-full w-full flex-shrink-0 ${banner.bg} flex items-center justify-center gap-1.5 px-2`}
          >
            <banner.icon className={`h-3.5 w-3.5 ${banner.textColor} opacity-80 sm:h-4 sm:w-4`} />
            <span className={`text-[11px] font-bold tracking-wide ${banner.textColor} sm:text-xs`}>
              {banner.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromoBanner;
