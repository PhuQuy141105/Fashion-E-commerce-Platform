import React, { useState, useEffect, useMemo, useCallback } from 'react';
import HeroBanner from '../../components/HeroBanner/HeroBanner';
import { SearchBar } from '../../components/SearchBar/SearchBar';
import FilterPanel from '../../components/FilterPanel/FilterPanel';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import Navbar from '../../components/Navbar/Navbar';
import { ProductOptionModal } from '../../components/ProductOptionModal/ProductOptionModal';
import { authApis, endpoints } from '../../configs/Apis';
import {
  fetchProducts,
  fetchCategories,
  fetchBrands,
  DEFAULT_FILTERS,
  FIXED_PAGE_SIZE,
} from '../../services/ProductService';
import styles from './Home.module.css';

export default function Home({
  activePage = 'home',
  onPageChange = () => {},
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
  initialSearchQuery = '',
  onSearchChange,
  onOpenLogoutModal = () => {},
  onOpenAIStylist = () => {},
  onSelectOrder = () => {},
}) {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    search: initialSearchQuery,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(FIXED_PAGE_SIZE); 
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);

  useEffect(() => {
    if (initialSearchQuery !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        search: initialSearchQuery,
      }));

      setCurrentPage(1);
    }
  }, [initialSearchQuery]);

  const loadUser = async () => {
    try {
      const res = await authApis.get(endpoints['current-user']);
      setCurrentUser(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchBrands().then(setBrands);
    loadUser();
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const result = await fetchProducts(filters, currentPage);

      setProducts(result.items);
      setTotalItems(result.totalItems);
      setTotalPages(result.totalPages);
      setItemsPerPage(result.pageSize);
    } catch (err) {
      console.error('Không tải được danh sách sản phẩm:', err);

      setHasError(true);
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 350);

    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleSearchInput = (value) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
    }));

    setCurrentPage(1);
    onSearchChange?.(value);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      search: '',
    });

    setCurrentPage(1);
    onSearchChange?.('');
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return;
    }

    setCurrentPage(newPage);

    const gridEl = document.getElementById('product-grid-section');

    if (gridEl) {
      const y = gridEl.getBoundingClientRect().top + window.pageYOffset - 80;

      window.scrollTo({
        top: y,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollToProducts = () => {
    document.getElementById('search-filter-section')?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const activeCategoryTitle = useMemo(() => {
    if (filters.search.trim()) {
      return `Kết quả tìm kiếm cho "${filters.search}"`;
    }

    if (filters.category && filters.category !== 'All') {
      const category = categories.find((c) => String(c.id) === String(filters.category));

      return category?.name || 'Danh mục';
    }

    if (filters.brand && filters.brand !== 'All') {
      const brand = brands.find((b) => String(b.id) === String(filters.brand));

      return brand ? `Bộ sưu tập ${brand.name}` : 'Thương hiệu';
    }

    return 'Tất cả sản phẩm';
  }, [filters, categories, brands]);

  const colorSuggestions = useMemo(
    () => Array.from(new Set(products.flatMap((product) => product.available_colors || []))),
    [products]
  );

  return (
    <>
      <Navbar
        activePage={activePage}
        onPageChange={onPageChange}
        searchQuery={filters.search}
        onSearchChange={handleSearchInput}
        onOpenLogoutModal={onOpenLogoutModal}
        onOpenAIStylist={onOpenAIStylist}
        onSelectOrder={onSelectOrder}
        currentUser={currentUser}
      />
      <main className={styles.homePage}>
        <HeroBanner onShopNow={handleScrollToProducts} onExploreCollection={handleScrollToProducts} />

        <div id="search-filter-section" className={styles.searchFilterSection}>
          <div className={styles.mobileSearch}>
            <SearchBar value={filters.search} onChange={handleSearchInput} onClear={() => handleSearchInput('')} />
          </div>

          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            totalResults={totalItems}
            categories={categories}
            brands={brands}
            colorSuggestions={colorSuggestions}
          />
        </div>

        {hasError && <div className={styles.errorMessage}>Không thể tải danh sách sản phẩm. Vui lòng thử lại.</div>}

        <ProductGrid
          products={products}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          onSelectProduct={onSelectProduct}
          onClearFilters={handleClearAll}
          onAddToCart={(product) => setModalProduct(product)}
          onToggleWishlist={onToggleWishlist}
          wishlistIds={wishlistIds}
          activeCategoryTitle={activeCategoryTitle}
        />

        <ProductOptionModal
          isOpen={Boolean(modalProduct)}
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onConfirmAddToCart={(product, quantity, color, size) => {
            onAddToCart?.(product, quantity, color, size);
          }}
        />
      </main>
    </>
  );
}