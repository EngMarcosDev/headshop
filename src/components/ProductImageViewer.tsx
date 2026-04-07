import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface ProductImageViewerProps {
  image: string;
  alt: string;
}

const DESKTOP_LENS_SIZE = 148;
const DESKTOP_MIN_ZOOM = 1.9;
const DESKTOP_MAX_ZOOM = 4.2;
const MOBILE_MAX_ZOOM = 4;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getTouchDistance = (first: Touch, second: Touch) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

type TouchGestureState =
  | {
      mode: "pinch";
      startDistance: number;
      startScale: number;
      startOffset: { x: number; y: number };
      startCenter: { x: number; y: number };
    }
  | {
      mode: "pan";
      startPoint: { x: number; y: number };
      startOffset: { x: number; y: number };
    };

const ProductImageViewer = ({ image, alt }: ProductImageViewerProps) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const touchGestureRef = useRef<TouchGestureState | null>(null);

  const [isDesktopInteractive, setIsDesktopInteractive] = useState(false);
  const [isLensActive, setIsLensActive] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });
  const [desktopZoom, setDesktopZoom] = useState(2.35);
  const [mobileScale, setMobileScale] = useState(1);
  const [mobileOffset, setMobileOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const syncDesktopMode = () => {
      setIsDesktopInteractive(mediaQuery.matches);
      if (mediaQuery.matches) {
        setMobileScale(1);
        setMobileOffset({ x: 0, y: 0 });
      } else {
        setIsLensActive(false);
      }
    };

    syncDesktopMode();
    mediaQuery.addEventListener("change", syncDesktopMode);
    return () => mediaQuery.removeEventListener("change", syncDesktopMode);
  }, []);

  useEffect(() => {
    setIsLensActive(false);
    setLensPosition({ x: 50, y: 50 });
    setDesktopZoom(2.35);
    setMobileScale(1);
    setMobileOffset({ x: 0, y: 0 });
    touchGestureRef.current = null;
  }, [image]);

  const limitMobileOffset = (scale: number, nextOffset: { x: number; y: number }) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return nextOffset;

    const maxX = Math.max(0, ((scale - 1) * rect.width) / 2);
    const maxY = Math.max(0, ((scale - 1) * rect.height) / 2);

    return {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY),
    };
  };

  const updateLensPosition = (clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = clamp(((clientX - rect.left) / Math.max(rect.width, 1)) * 100, 0, 100);
    const y = clamp(((clientY - rect.top) / Math.max(rect.height, 1)) * 100, 0, 100);
    setLensPosition({ x, y });
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopInteractive) return;
    updateLensPosition(event.clientX, event.clientY);
    setIsLensActive(true);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopInteractive) return;
    updateLensPosition(event.clientX, event.clientY);
  };

  const handleMouseLeave = () => {
    if (!isDesktopInteractive) return;
    setIsLensActive(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!isDesktopInteractive) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.18 : -0.18;
    setDesktopZoom((current) =>
      clamp(Number((current + delta).toFixed(2)), DESKTOP_MIN_ZOOM, DESKTOP_MAX_ZOOM)
    );
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDesktopInteractive) return;

    if (event.touches.length >= 2) {
      const [first, second] = [event.touches[0], event.touches[1]];
      const nextCenter = {
        x: (first.clientX + second.clientX) / 2,
        y: (first.clientY + second.clientY) / 2,
      };

      touchGestureRef.current = {
        mode: "pinch",
        startDistance: getTouchDistance(first, second),
        startScale: mobileScale,
        startOffset: mobileOffset,
        startCenter: nextCenter,
      };
      return;
    }

    if (event.touches.length === 1 && mobileScale > 1) {
      const [touch] = [event.touches[0]];
      touchGestureRef.current = {
        mode: "pan",
        startPoint: { x: touch.clientX, y: touch.clientY },
        startOffset: mobileOffset,
      };
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDesktopInteractive) return;
    const gesture = touchGestureRef.current;
    if (!gesture) return;

    if (gesture.mode === "pinch" && event.touches.length >= 2) {
      event.preventDefault();
      const [first, second] = [event.touches[0], event.touches[1]];
      const nextDistance = getTouchDistance(first, second);
      const scaleRatio = nextDistance / Math.max(gesture.startDistance, 1);
      const nextScale = clamp(
        Number((gesture.startScale * scaleRatio).toFixed(2)),
        1,
        MOBILE_MAX_ZOOM
      );
      const nextCenter = {
        x: (first.clientX + second.clientX) / 2,
        y: (first.clientY + second.clientY) / 2,
      };
      const driftOffset = {
        x: gesture.startOffset.x + (nextCenter.x - gesture.startCenter.x),
        y: gesture.startOffset.y + (nextCenter.y - gesture.startCenter.y),
      };

      setMobileScale(nextScale);
      setMobileOffset(limitMobileOffset(nextScale, driftOffset));
      return;
    }

    if (gesture.mode === "pan" && event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      const nextOffset = {
        x: gesture.startOffset.x + (touch.clientX - gesture.startPoint.x),
        y: gesture.startOffset.y + (touch.clientY - gesture.startPoint.y),
      };

      setMobileOffset(limitMobileOffset(mobileScale, nextOffset));
    }
  };

  const handleTouchEnd = () => {
    if (isDesktopInteractive) return;
    if (mobileScale <= 1.02) {
      setMobileScale(1);
      setMobileOffset({ x: 0, y: 0 });
    }
    touchGestureRef.current = null;
  };

  return (
    <div className="rounded-[30px] border border-border bg-card/90 p-3 shadow-sm dark:bg-card/75">
      <div
        ref={frameRef}
        className="group relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(248,234,193,0.52)_38%,rgba(141,101,57,0.14)_100%)]"
        style={{
          touchAction: isDesktopInteractive ? "auto" : mobileScale > 1 ? "none" : "pan-y",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <img
          src={image}
          alt={alt}
          className="min-h-[280px] w-full rounded-[24px] object-contain p-3 transition-transform duration-200 sm:min-h-[340px] md:min-h-[440px] md:p-5"
          style={
            isDesktopInteractive
              ? undefined
              : {
                  transform: `translate3d(${mobileOffset.x}px, ${mobileOffset.y}px, 0) scale(${mobileScale})`,
                }
          }
          onError={(event) => {
            event.currentTarget.src = "/placeholder.svg";
          }}
        />

        {isDesktopInteractive ? (
          <>
            <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/95 shadow-lg backdrop-blur-sm">
              Hover zoom
            </div>

            <div
              className={`pointer-events-none absolute right-4 top-4 hidden h-[148px] w-[148px] overflow-hidden rounded-[22px] border border-white/70 bg-black/15 shadow-[0_20px_40px_-24px_rgba(15,15,15,0.85)] ring-1 ring-black/10 backdrop-blur-sm transition-all duration-200 md:block ${
                isLensActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <div
                className="h-full w-full bg-cover bg-no-repeat"
                style={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: `${desktopZoom * 100}%`,
                  backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                <span className="inline-flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Lupa
                </span>
                <span>{desktopZoom.toFixed(1)}x</span>
              </div>
            </div>

            <div
              className={`pointer-events-none absolute rounded-[22px] border border-white/80 shadow-[0_0_0_1px_rgba(15,15,15,0.05),0_16px_28px_-18px_rgba(15,15,15,0.75)] ring-1 ring-black/10 transition-all duration-150 ${
                isLensActive ? "opacity-100" : "opacity-0"
              }`}
              style={{
                width: `${DESKTOP_LENS_SIZE}px`,
                height: `${DESKTOP_LENS_SIZE}px`,
                left: `calc(${lensPosition.x}% - ${DESKTOP_LENS_SIZE / 2}px)`,
                top: `calc(${lensPosition.y}% - ${DESKTOP_LENS_SIZE / 2}px)`,
                backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06))`,
                backdropFilter: "blur(2px)",
              }}
            />
          </>
        ) : (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-4 py-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              <Search className="h-3.5 w-3.5" />
              Touch zoom
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {isDesktopInteractive
            ? "Passe o mouse para ativar a lupa e use o scroll para ajustar o zoom."
            : "Use dois dedos para aproximar a imagem e arraste quando o zoom estiver ativo."}
        </span>
        {!isDesktopInteractive && mobileScale > 1 ? (
          <button
            type="button"
            onClick={() => {
              setMobileScale(1);
              setMobileOffset({ x: 0, y: 0 });
            }}
            className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Resetar zoom
          </button>
        ) : (
          <span>{isDesktopInteractive ? `Zoom ${desktopZoom.toFixed(1)}x` : `Zoom ${mobileScale.toFixed(1)}x`}</span>
        )}
      </div>
    </div>
  );
};

export default ProductImageViewer;
