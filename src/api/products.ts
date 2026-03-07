import { apiGet, apiGetWithBase, ERP_API_BASE, USE_MOCKS } from "./client";
import { mockApi } from "./mocks";
import type { ApiListResponse, Product } from "./types";

const unwrapList = <T,>(payload: ApiListResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) return payload;
  if ((payload as any) && Array.isArray((payload as any).products)) return (payload as any).products;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const filterActive = (products: Product[]) =>
  products.filter((item) => item.isActive !== false);

export async function fetchFeaturedProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.featuredProducts();

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>("/products/featured");
    return filterActive(unwrapList(response));
  } catch {
    // ignore and try ERP fallback
  }

  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      "/products/featured"
    );
    return filterActive(unwrapList(response));
  } catch {
    return [];
  }
}

export async function fetchPopularProducts(): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.popularProducts();

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>("/products/popular");
    return filterActive(unwrapList(response));
  } catch {
    // ignore and try ERP fallback
  }

  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      "/products/popular"
    );
    return filterActive(unwrapList(response));
  } catch {
    return [];
  }
}

export async function fetchProductsByCategory(slug: string): Promise<Product[]> {
  if (USE_MOCKS) return mockApi.productsByCategory(slug);
  const safeSlug = encodeURIComponent(slug);

  try {
    const response = await apiGet<ApiListResponse<Product> | Product[]>(`/categories/${safeSlug}/products`);
    return unwrapList(response);
  } catch {
    // ignore and try ERP fallback
  }

  try {
    const response = await apiGetWithBase<ApiListResponse<Product> | Product[]>(
      ERP_API_BASE,
      `/categories/${safeSlug}/products`
    );
    return unwrapList(response);
  } catch {
    return [];
  }
}
