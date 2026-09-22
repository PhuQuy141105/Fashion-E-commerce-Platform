import { authApis, endpoints } from "../configs/Apis";

export const SIZES = ['All', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREESIZE'];

export const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'best_selling', label: 'Bán chạy nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp đến cao' },
  { value: 'price_desc', label: 'Giá: Cao đến thấp' },
];

export const FIXED_PAGE_SIZE = 8;
export const DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  brand: 'All',
  minPrice: 0,
  maxPrice: 1000000,
  size: 'All',
  color: '',
  sort: '',
};

function buildProductParams(filters, page) {
  const params = {};
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.category && filters.category !== 'All') params.category = filters.category;
  if (filters.brand && filters.brand !== 'All') params.brand = filters.brand;
  if (filters.minPrice) params.min_price = filters.minPrice;
  if (filters.maxPrice) params.max_price = filters.maxPrice;
  if (filters.size && filters.size !== 'All') params.size = filters.size;
  if (filters.color?.trim()) params.color = filters.color.trim();
  if (filters.sort) params.sort = filters.sort;
  if (page) params.page = page;
  return params;
}

export async function fetchProducts(filters, page = 1) {
  const params = buildProductParams(filters, page);
  const { data } = await authApis.get(endpoints['products'], { params });
  const items = data.results ?? data;
  const totalItems = data.count ?? items.length;
  const hasNextPage = data.next != null;

  let totalPages;
  let pageSize;

  if (hasNextPage) {
    pageSize = items.length || FIXED_PAGE_SIZE;
    totalPages = Math.max(page + 1, Math.ceil(totalItems / pageSize));
  } else {
    totalPages = Math.max(1, page);
    pageSize = items.length || FIXED_PAGE_SIZE;
  }

  return { items, totalItems, totalPages, currentPage: page, pageSize, hasNextPage };
}


export const ADMIN_DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  brand: 'All',
  status: 'All',
  stockStatus: 'All',
};

function buildAdminProductParams(filters, page) {
  const params = {};
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.category && filters.category !== 'All') params.category = filters.category;
  if (filters.brand && filters.brand !== 'All') params.brand = filters.brand;
  if (filters.status && filters.status !== 'All') params.status = filters.status;
  if (filters.stockStatus && filters.stockStatus !== 'All') params.stock_status = filters.stockStatus;
  if (page) params.page = page;
  return params;
}

export async function fetchAdminProducts(filters, page = 1) {
  const params = buildAdminProductParams(filters, page);
  const { data } = await authApis.get(endpoints['products'], { params });
  const items = data.results ?? data;
  const totalItems = data.count ?? items.length;
  const hasNextPage = data.next != null;

  let totalPages;
  let pageSize;
  if (hasNextPage) {
    pageSize = items.length || FIXED_PAGE_SIZE;
    totalPages = Math.max(page + 1, Math.ceil(totalItems / pageSize));
  } else {
    totalPages = Math.max(1, page);
    pageSize = items.length || FIXED_PAGE_SIZE;
  }

  return { items, totalItems, totalPages, currentPage: page, pageSize, hasNextPage };
}

export async function fetchCategories() {
  try {
    const { data } = await authApis.get(endpoints['categories']);
    return data.results ?? data;
  } catch (e) {
    console.error('Không tải được danh mục:', e);
    return [];
  }
}

export async function fetchBrands() {
  try {
    const { data } = await authApis.get(endpoints['brands']);
    return data.results ?? data;
  } catch (e) {
    console.error('Không tải được thương hiệu:', e);
    return [];
  }
}