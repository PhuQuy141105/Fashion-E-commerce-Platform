import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import styles from './ReviewFilterToolbar.module.css';

export const ReviewFilterToolbar = ({ filters, onApplyFilters, onResetFilters, totalResults, isLoading }) => {
  const hasActiveFilters = filters.search.trim() !== '' || filters.rating !== 'ALL' || filters.ordering !== 'newest';

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            id="review-search-input"
            value={filters.search}
            onChange={(e) => onApplyFilters({ search: e.target.value })}
            placeholder="Tìm theo nội dung đánh giá..."
            className={styles.searchInput}
          />
        </div>

        <select
          id="review-rating-filter"
          value={filters.rating}
          onChange={(e) => onApplyFilters({ rating: e.target.value })}
          className={styles.select}
        >
          <option value="ALL">Tất cả số sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>

        <div className={styles.sortWrapper}>
          <ArrowUpDown className={styles.sortIcon} />
          <select
            id="review-ordering-select"
            value={filters.ordering}
            onChange={(e) => onApplyFilters({ ordering: e.target.value })}
            className={`${styles.select} ${styles.selectWithIcon}`}
          >
            <option value="newest">Mới nhất</option>
            <option value="rating_desc">Số sao cao nhất</option>
            <option value="rating_asc">Số sao thấp nhất</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button type="button" id="review-reset-filters-btn" onClick={onResetFilters} className={styles.resetButton}>
            <RotateCcw className={styles.resetIcon} />
          </button>
        )}
      </div>

      {!isLoading && (
        <p className={styles.resultText}>
          Tìm thấy <strong>{totalResults}</strong> đánh giá
        </p>
      )}
    </div>
  );
};

export default ReviewFilterToolbar;