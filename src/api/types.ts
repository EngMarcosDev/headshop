export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  bannerImage?: string;
  gallery?: string[];
  isNew?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  category?: string;
  material?: string;
  brand?: string;
}

export interface ApiListResponse<T> {
  data: T[];
}
