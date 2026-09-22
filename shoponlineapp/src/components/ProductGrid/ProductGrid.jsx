import React from 'react';
import { LayoutGrid, List, SearchX, RotateCcw } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import { Pagination } from '../Pagination/Pagination';
import styles from './ProductGrid.module.css';

export const ProductGrid = ({
  products,
  isLoading = false,
  onSelectProduct,
  onClearFilters,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
  activeCategoryTitle = 'Tất cả sản phẩm',
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 8,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const [viewMode, setViewMode] = React.useState('grid');

  const startItem =
    totalItems === 0
      ? 0
      : Math.min(
          (currentPage - 1) * itemsPerPage + 1,
          totalItems
        );

  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems
  );

  return (
    <section
      id="product-grid-section"
      className={styles.productGridSection}
    >
      <div className={styles.gridHeader}>
        <div>
          <h2 className={styles.categoryTitle}>
            {activeCategoryTitle}
          </h2>

          <p className={styles.productCount}>
            {totalItems > 0 ? (
              <>
                Hiển thị{' '}
                <span className={styles.boldText}>
                  {startItem}–{endItem}
                </span>{' '}
                trong{' '}
                <span className={styles.boldText}>
                  {totalItems}
                </span>{' '}
                sản phẩm
              </>
            ) : (
              <span>Không có sản phẩm nào</span>
            )}
          </p>
        </div>

        <div className={styles.viewMode}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`${styles.viewModeButton} ${
              viewMode === 'grid'
                ? styles.viewModeActive
                : ''
            }`}
            aria-label="Dạng lưới"
            title="Dạng lưới"
          >
            <LayoutGrid size={16} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`${styles.viewModeButton} ${
              viewMode === 'list'
                ? styles.viewModeActive
                : ''
            }`}
            aria-label="Dạng danh sách"
            title="Dạng danh sách"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.productGrid}>
          {Array.from({ length: itemsPerPage }).map(
            (_, index) => (
              <div
                key={index}
                className={styles.productSkeleton}
              >
                <div className={styles.skeletonImage} />

                <div className={styles.skeletonTitle} />

                <div className={styles.skeletonName} />

                <div className={styles.skeletonPrice} />
              </div>
            )
          )}
        </div>
      ) : products.length === 0 ? (
        <div
          id="product-empty-state"
          className={styles.emptyState}
        >
          <div className={styles.emptyIcon}>
            <SearchX size={32} />
          </div>

          <h3 className={styles.emptyTitle}>
            Không có sản phẩm phù hợp
          </h3>

          <p className={styles.emptyDescription}>
            Thử thay đổi bộ lọc, điều chỉnh khoảng giá
            hoặc tìm kiếm với từ khoá khác.
          </p>

          <button
            type="button"
            onClick={onClearFilters}
            className={styles.clearFilterButton}
          >
            <RotateCcw size={14} />

            <span>Xoá bộ lọc</span>
          </button>
        </div>
      ) : (
        <div className={styles.productContent}>
          <div
            className={
              viewMode === 'grid'
                ? styles.productGrid
                : styles.productList
            }
          >
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlistIds.includes(prod.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
          {onPageChange && totalPages >= 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={
                onItemsPerPageChange
              }
            />
          )}
        </div>
      )}
    </section>
  );
};