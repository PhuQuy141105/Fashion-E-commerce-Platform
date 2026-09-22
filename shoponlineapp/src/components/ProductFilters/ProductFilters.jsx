import { Search, RotateCcw, Filter, X } from 'lucide-react';
import styles from './ProductFilters.module.css';

export const ProductFilters = ({ filters, categories, brands, onFilterChange, onReset }) => {
  const hasActiveFilters =
    filters.search.trim() !== '' || filters.category !== 'All' || filters.brand !== 'All' || filters.status !== 'All' || filters.stockStatus !== 'All';

  return (
    <div className={styles.card}>
      <div className={styles.grid}>
        <div className={styles.searchField}>
          <label className={styles.label}>Tìm sản phẩm</label>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              id="admin-filter-search-input"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              placeholder="Tìm theo tên, mô tả..."
              className={styles.searchInput}
            />
            {filters.search && (
              <button type="button" onClick={() => onFilterChange({ search: '', page: 1 })} className={styles.clearButton}>
                <X className={styles.clearIcon} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={styles.label}>Danh mục</label>
          <select
            id="admin-filter-category-select"
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className={styles.select}
          >
            <option value="All">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label}>Thương hiệu</label>
          <select
            id="admin-filter-brand-select"
            value={filters.brand}
            onChange={(e) => onFilterChange({ brand: e.target.value, page: 1 })}
            className={styles.select}
          >
            <option value="All">Tất cả thương hiệu</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label}>Trạng thái</label>
          <select
            id="admin-filter-status-select"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className={styles.select}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
            <option value="DISCONTINUED">Ngừng bán</option>
          </select>
        </div>

        <div>
          <label className={styles.label}>Tồn kho</label>
          <select
            id="admin-filter-stock-select"
            value={filters.stockStatus}
            onChange={(e) => onFilterChange({ stockStatus: e.target.value, page: 1 })}
            className={styles.select}
          >
            <option value="All">Mọi mức tồn kho</option>
            <option value="IN_STOCK">Còn hàng (10+)</option>
            <option value="LOW_STOCK">Sắp hết (&lt;10)</option>
            <option value="OUT_OF_STOCK">Hết hàng (0)</option>
          </select>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <Filter className={styles.footerIcon} />
          <span>{hasActiveFilters ? 'Đang lọc danh mục sản phẩm' : 'Hiện tất cả sản phẩm'}</span>
        </div>

        {hasActiveFilters && (
          <button type="button" id="admin-filter-reset-btn" onClick={onReset} className={styles.resetButton}>
            <RotateCcw className={styles.resetIcon} />
            <span>Đặt lại</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;