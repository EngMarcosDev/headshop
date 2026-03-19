import { apiGet, apiGetWithBase, ERP_API_BASE, USE_MOCKS } from "./client";
import { mockApi } from "./mocks";
import type { ApiListResponse, Product } from "./types";

const unwrapList = <T,>(payload: ApiListResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) return payload;
  if ((payload as any) && Array.isArray((payload as any).products)) return (payload as any).products;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const filterActive = (products: Product[]) => products.filter((item) => item.isActive !== false);

const normalizeCategory = (value: unknown) => {
  const normalize = (raw: string) => {
    const value = raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (value === "piteiras") return "piteira";
    if (value === "cuias") return "cuia";
    if (value === "fumigeno" || value === "fumigenos") return "fumigenos";
    if (value === "acessorio" || value === "acessorios") return "acessorios";
    return value;
  };

  if (typeof value === "string") return normalize(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.slug === "string" && record.slug.trim()) return normalize(record.slug);
    if (typeof record.name === "string" && record.name.trim()) return normalize(record.name);
  }
  return "";
};

const mediaBaseOrigin = () => {
  if (typeof window === "undefined") return "";
  try {
    return new URL(window.location.origin).origin;
  } catch {
    return "";
  }
};

const normalizeMediaUrl = (value: unknown): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw;

  if (typeof window === "undefined") return raw;
  const browserOrigin = mediaBaseOrigin();
  if (!browserOrigin) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      if (isLocalHost && window.location.hostname.endsWith("bacaxita.com.br")) {
        parsed.protocol = window.location.protocol;
        parsed.host = window.location.host;
        return parsed.toString();
      }
      return raw;
    } catch {
      return raw;
    }
  }

  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${browserOrigin}${normalizedPath}`;
};

const normalizeProduct = (value: any): Product => {
  const image = normalizeMediaUrl(value?.image || value?.imageUrl || value?.image_link);
  const banner = normalizeMediaUrl(value?.bannerImage || value?.banner);
  const gallery = Array.isArray(value?.gallery)
    ? value.gallery.map((entry: unknown) => normalizeMediaUrl(entry)).filter(Boolean)
    : [];
  const normalizedGallery = [image, banner, ...gallery].filter(Boolean);

  return {
    id: Number(value?.id || 0),
    name: String(value?.name || "Produto"),
    price: Number(value?.price || 0),
    originalPrice: value?.originalPrice != null ? Number(value.originalPrice) : null,
    discountPercent: value?.discountPercent != null ? Number(value.discountPercent) : null,
    discountAmount: value?.discountAmount != null ? Number(value.discountAmount) : null,
    discountLabel: typeof value?.discountLabel === "string" ? value.discountLabel : null,
    discountActive: value?.discountActive === true,
    image: normalizedGallery[0] || "/placeholder.svg",
    bannerImage: banner || undefined,
    gallery: normalizedGallery,
    isNew: Boolean(value?.isNew),
    isActive: value?.isActive ?? value?.active ?? true,
    isFeatured: Boolean(value?.isFeatured),
    isPopular: Boolean(value?.isPopular),
    category: normalizeCategory(value?.category),
    material: typeof value?.material === "string" ? value.material : undefined,
    brand: typeof value?.brand === "string" ? value.brand : undefined,
  };
};

const normalizeList = (payload: ApiListResponse<Product> | Product[] | any): Product[] =>
  unwrapList(payload).map(normalizeProduct).filter((product) => product.id > 0);

const sortBanners = (products: Product[]) =>
  [...products].sort((a, b) => {
    const aPos = Number((a as any)?.bannerOrder ?? 0);
    const bPos = Number((b as any)?.bannerOrder ?? 0);
    return aPos - bPos;
  });

export async function fetchNewsBanners(): Promise<Product[]> {
  if (USE_MOCKS) {
    return mockApi.featuredProducts();
  }

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>("/banners");
    return sortBanners(filterActive(normalizeList(response)));
  } catch {
    // ignore and try featured fallback
  }

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>("/products/featured");
    const products = filterActive(normalizeList(response)).filter((item) => item.category === "banners");
    return sortBanners(products);
  } catch {
    return [];
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.featuredProducts();

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>("/products/featured");
    return filterActive(normalizeList(response));
  } catch {
    // ignore and try ERP fallback
  }

  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(ERP_API_BASE, "/products/featured");
    return filterActive(normalizeList(response));
  } catch {
    return [];
  }
}

export async function fetchPopularProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.popularProducts();

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>("/products/popular");
    return filterActive(normalizeList(response));
  } catch {
    // ignore and try ERP fallback
  }

  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(ERP_API_BASE, "/products/popular");
    return filterActive(normalizeList(response));
  } catch {
    return [];
  }
}

export async function fetchProductsByCategory(slug: string): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.productsByCategory(slug);
  const safeSlug = encodeURIComponent(slug);

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>(`/categories/${safeSlug}/products`);
    return filterActive(normalizeList(response));
  } catch {
    // ignore and try ERP fallback
  }

  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      `/categories/${safeSlug}/products`
    );
    return filterActive(normalizeList(response));
  } catch {
    return [];
  }
}
