import { Cigarette, Coffee, Filter, Flame, Package, Scissors, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface HeadshopCategory {
  slug: string;
  name: string;
  href: string;
  icon: LucideIcon;
  image?: string | null;
}

export const HOME_CATEGORY_LIMIT = 5;

export const HEADSHOP_CATEGORIES: HeadshopCategory[] = [
  { slug: "sedas", name: "Sedas", href: "/categoria/sedas", icon: Cigarette },
  { slug: "piteira", name: "Piteiras", href: "/categoria/piteira", icon: Filter },
  { slug: "fumigenos", name: "Fumígenos", href: "/categoria/fumigenos", icon: Flame },
  { slug: "cuia", name: "Cuias", href: "/categoria/cuia", icon: Coffee },
  { slug: "bacakits", name: "AbacaKits", href: "/categoria/bacakits", icon: Package },
  { slug: "acessorios", name: "Acessórios", href: "/categoria/acessorios", icon: Sparkles },
  { slug: "tesoura", name: "Tesouras", href: "/categoria/tesoura", icon: Scissors },
  { slug: "banners", name: "Banners", href: "/categoria/banners", icon: Sparkles },
];

const CATEGORY_ALIAS: Record<string, string> = {
  sedas: "sedas",
  seda: "sedas",
  piteira: "piteira",
  piteiras: "piteira",
  fumigeno: "fumigenos",
  fumigenos: "fumigenos",
  cuia: "cuia",
  cuias: "cuia",
  bacakit: "bacakits",
  bacakits: "bacakits",
  abacakit: "bacakits",
  abacakits: "bacakits",
  acessorio: "acessorios",
  acessorios: "acessorios",
  tesoura: "tesoura",
  tesouras: "tesoura",
  banner: "banners",
  banners: "banners",
};

const normalizeText = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const normalizeCategorySlug = (value: unknown): string => {
  const normalized = normalizeText(value);
  return CATEGORY_ALIAS[normalized] || normalized;
};

export const getCategoryBySlug = (slug: unknown, categories: HeadshopCategory[] = HEADSHOP_CATEGORIES) => {
  const normalized = normalizeCategorySlug(slug);
  return categories.find((category) => normalizeCategorySlug(category.slug) === normalized);
};

const iconMap: Record<string, LucideIcon> = {
  sedas: Cigarette,
  piteira: Filter,
  fumigenos: Flame,
  cuia: Coffee,
  bacakits: Package,
  acessorios: Sparkles,
  tesoura: Scissors,
  banners: Sparkles,
};

export const getCategoryIcon = (slug: string): LucideIcon => {
  const normalized = normalizeCategorySlug(slug);
  return iconMap[normalized] || Sparkles;
};

const resolveImageUrl = (image?: string | null): string | null => {
  if (!image) return null;
  // Base64 data URL or full URL — use as-is
  if (image.startsWith("data:") || image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  // Relative path: prepend backend origin
  const backendBase =
    typeof window !== "undefined" && window.location.hostname.endsWith("bacaxita.com.br")
      ? `${window.location.protocol}//${window.location.host}`
      : "http://localhost:5050";
  return `${backendBase}${image.startsWith("/") ? "" : "/"}${image}`;
};

export const buildCategoryFromApi = (entry: { slug: string; name: string; image?: string | null }): HeadshopCategory => {
  const slug = normalizeCategorySlug(entry.slug);
  return {
    slug,
    name: entry.name || slug,
    href: `/categoria/${slug}`,
    icon: getCategoryIcon(slug),
    image: resolveImageUrl(entry.image),
  };
};
