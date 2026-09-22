import { EyeOff, Eye, X, CheckSquare } from 'lucide-react';
import styles from './BulkModerationBar.module.css';

export const BulkModerationBar = ({ selectedCount, totalCount, onSelectAll, onBulkHide, onBulkShow, onClearSelection, isProcessing }) => {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount;

  return (
    <div id="bulk-moderation-bar" className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.iconBox}>
          <CheckSquare className={styles.icon} />
        </div>
        <div>
          <span className={styles.countText}>Đã chọn {selectedCount} đánh giá</span>
          <button type="button" onClick={() => onSelectAll(!isAllSelected)} className={styles.selectAllLink}>
            {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả trong danh sách'}
          </button>
        </div>
      </div>

      <div className={styles.right}>
        <button type="button" id="bulk-hide-btn" onClick={onBulkHide} disabled={isProcessing} className={styles.hideButton}>
          <EyeOff className={styles.actionIcon} />
          <span>Ẩn đã chọn</span>
        </button>
        <button type="button" id="bulk-show-btn" onClick={onBulkShow} disabled={isProcessing} className={styles.showButton}>
          <Eye className={styles.actionIcon} />
          <span>Hiện đã chọn</span>
        </button>
        <button type="button" onClick={onClearSelection} className={styles.clearButton} aria-label="Bỏ chọn">
          <X className={styles.clearIcon} />
        </button>
      </div>
    </div>
  );
};

export default BulkModerationBar;