import { Cigarette, Coffee, Filter, Flame, Package, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HeadshopCategorySlug =
  | "sedas"
  | "piteira"
  | "fumigenos"
  | "cuia"
  | "bacakits"
  | "acessorios"
  | "banners";

export interface HeadshopCategory {
  slug: HeadshopCategorySlug;
  name: string;
  href: string;
  icon: LucideIcon;
}

export const HEADSHOP_CATEGORIES: HeadshopCategory[] = [
  { slug: "sedas", name: "Sedas", href: "/categoria/sedas", icon: Cigarette },
  { slug: "piteira", name: "Piteiras", href: "/categoria/piteira", icon: Filter },
  { slug: "fumigenos", name: "Fumigenos", href: "/categoria/fumigenos", icon: Flame },
  { slug: "cuia", name: "Cuias", href: "/categoria/cuia", icon: Coffee },
  { slug: "bacakits", name: "AbacaKits", href: "/categoria/bacakits", icon: Package },
  { slug: "acessorios", name: "Acessorios", href: "/categoria/acessorios", icon: Sparkles },
  { slug: "banners", name: "Banners", href: "/categoria/banners", icon: Sparkles },
];

const CATEGORY_ALIAS: Record<string, HeadshopCategorySlug> = {
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
  banner: "banners",
  banners: "banners",
};

export const normalizeCategorySlug = (value: unknown): HeadshopCategorySlug => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return CATEGORY_ALIAS[normalized] || "acessorios";
};

export const getCategoryBySlug = (slug: unknown) => {
  const normalized = normalizeCategorySlug(slug);
  return HEADSHOP_CATEGORIES.find((category) => category.slug === normalized);
};
