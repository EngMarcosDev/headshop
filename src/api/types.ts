export interface Product {
  id: number;
  name: string;
  description?: string;
  details?: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  discountLabel?: string | null;
  discountActive?: boolean;
  image: string;
  bannerImage?: string;
  showBannerPrice?: boolean;
  gallery?: string[];
  isNew?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  category?: string;
  subcategory?: string;
  material?: string;
  brand?: string;
}

export interface ApiListResponse<T> {
  data: T[];
}
