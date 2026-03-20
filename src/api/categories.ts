import { apiGet } from "./client";

export interface HeadshopCategoryApi {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  position?: number;
  _count?: {
    products?: number;
  };
}

export async function fetchStoreCategories(): Promise<HeadshopCategoryApi[]> {
  try {
    const payload = await apiGet<HeadshopCategoryApi[]>("/categories");
    if (!Array.isArray(payload)) return [];
    return payload;
  } catch {
    return [];
  }
}
