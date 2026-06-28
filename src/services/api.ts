import type { Product, Category } from '../types';

const BASE_URL = 'https://dummyjson.com';

interface FetchProductsOptions {
  category?: string;
  searchQuery?: string;
  limit?: number;
  skip?: number;
}

export interface FetchProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<FetchProductsResponse> {
  const { category, searchQuery, limit = 30, skip = 0 } = options;
  let url = `${BASE_URL}/products`;

  if (category && category !== 'all') {
    url = `${BASE_URL}/products/category/${category}`;
  } else if (searchQuery) {
    url = `${BASE_URL}/products/search?q=${encodeURIComponent(searchQuery)}`;
  }

  // Append pagination params
  const separator = url.includes('?') ? '&' : '?';
  url = `${url}${separator}limit=${limit}&skip=${skip}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      products: (data.products || []) as Product[],
      total: data.total || 0,
      skip: data.skip || 0,
      limit: data.limit || limit
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0, skip: 0, limit: 12 };
  }
}

export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product by id: ${response.statusText}`);
    }
    const data = await response.json();
    return data as Product;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${BASE_URL}/products/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    const data = await response.json();
    
    // DummyJSON can return either string[] or an array of objects depending on the endpoint version
    if (Array.isArray(data)) {
      return data.map((cat: any) => {
        if (typeof cat === 'string') {
          // Format slug properly (lowercase, hyphenated)
          const name = cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return {
            slug: cat,
            name: name,
            url: `${BASE_URL}/products/category/${cat}`
          };
        } else if (cat && typeof cat === 'object') {
          return {
            slug: cat.slug || '',
            name: cat.name || cat.slug || '',
            url: cat.url || `${BASE_URL}/products/category/${cat.slug}`
          };
        }
        return { slug: '', name: '' };
      }).filter(c => c.slug !== '');
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
