interface ProductSearchResult {
  name: string;
  price: number;
  image: string;
  badge?: string;
  size?: string;
  unit?: string;
  category?: string;
}

interface ProductSearchPage {
  results: ProductSearchResult[];
  page: number;
  hasMore: boolean;
}

const SERPAPI_URL = "https://serpapi.com/search.json";

const searchProducts = async (
  q: string,
  brand: string,
  size: string,
  page: number,
  limit: number,
  apiKey: string
): Promise<ProductSearchPage> => {
  try {
    const query = [q, brand, size].filter(Boolean).join(" ");

    const params = new URLSearchParams({
      engine: "google_shopping",
      q: query,
      google_domain: "google.com.br",
      gl: "br",
      hl: "pt-br",
      api_key: apiKey,
    });

    const res = await fetch(`${SERPAPI_URL}?${params.toString()}`);
    const body: any = await res.json();

    if (!res.ok || body.error) {
      throw new Error(body.error || `Search provider returned ${res.status}`);
    }

    const all: ProductSearchResult[] = (body.shopping_results || [])
      .filter((item: any) => item.title && item.extracted_price)
      .map((item: any) => ({
        name: item.title,
        price: item.extracted_price,
        image: item.thumbnail || "",
        badge: brand || undefined,
        size: size || undefined,
      }));

    const start = (page - 1) * limit;
    const results = all.slice(start, start + limit);
    const hasMore = all.length > start + limit;

    return { results, page, hasMore };
  } catch (error) {
    throw error;
  }
};

export { searchProducts, ProductSearchResult, ProductSearchPage };
