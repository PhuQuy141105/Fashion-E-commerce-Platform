import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import styles from './VoucherFiltersToolbar.module.css';

export const VoucherFiltersToolbar = ({ filters, onApplyFilters, onResetFilters }) => {
  const hasActiveFilters =
    filters.search.trim() !== '' || filters.status !== 'ALL' || filters.discountType !== 'ALL' || filters.ordering !== 'newest';

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            id="voucher-search-input"
            value={filters.search}
            onChange={(e) => onApplyFilters({ search: e.target.value })}
            placeholder="Tìm theo mã hoặc mô tả voucher..."
            className={styles.searchInput}
          />
        </div>

        <select
          id="voucher-status-filter"
          value={filters.status}
          onChange={(e) => onApplyFilters({ status: e.target.value })}
          className={styles.select}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="VALID">Còn hạn</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>

        <select
          id="voucher-discount-type-filter"
          value={filters.discountType}
          onChange={(e) => onApplyFilters({ discountType: e.target.value })}
          className={styles.select}
        >
          <option value="ALL">Tất cả loại giảm giá</option>
          <option value="PERCENT">Giảm theo %</option>
          <option value="FIXED">Giảm cố định</option>
        </select>

        <div className={styles.sortWrapper}>
          <ArrowUpDown className={styles.sortIcon} />
          <select
            id="voucher-ordering-select"
            value={filters.ordering}
            onChange={(e) => onApplyFilters({ ordering: e.target.value })}
            className={`${styles.select} ${styles.selectWithIcon}`}
          >
            <option value="newest">Mới tạo nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="end_date_asc">Sắp hết hạn nhất</option>
            <option value="end_date_desc">Hạn dùng xa nhất</option>
            <option value="discount_value_desc">Giảm giá cao nhất</option>
            <option value="discount_value_asc">Giảm giá thấp nhất</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button type="button" id="voucher-reset-filters-btn" onClick={onResetFilters} className={styles.resetButton}>
            <RotateCcw className={styles.resetIcon} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VoucherFiltersToolbar;