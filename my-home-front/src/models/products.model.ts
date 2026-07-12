interface IProducts {
  _id: string;
  createdByUserId: string;
  home: string;
  cod: string;
  name: string;
  unit: string;
  badge: string;
  size: string;
  price: number;
  characteristic: string;
  description: string;
  image: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSearchResult {
  name: string;
  price: number;
  image: string;
  badge?: string;
  size?: string;
  unit?: string;
  category?: string;
}

export interface ProductSearchPage {
  results: ProductSearchResult[];
  page: number;
  hasMore: boolean;
}

export default IProducts;
