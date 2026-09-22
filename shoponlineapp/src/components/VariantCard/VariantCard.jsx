import { Edit3, RefreshCw, AlertTriangle } from 'lucide-react';
import styles from './VariantCard.module.css';

export const VariantCard = ({ variant, onEdit, onUpdateStock }) => {
  const isOutOfStock = variant.stock_qty === 0;
  const isLowStock = variant.stock_qty > 0 && variant.stock_qty < 10;

  return (
    <div className={`${styles.card} ${isOutOfStock ? styles.cardOutOfStock : isLowStock ? styles.cardLowStock : ''}`}>
      <div>
        <div className={styles.topRow}>
          <div>
            <div className={styles.nameRow}>
              <span className={styles.colorName}>{variant.color}</span>
              <span className={styles.sizeTag}>Size {variant.size}</span>
            </div>
          </div>

          {isOutOfStock ? (
            <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>
              <span className={styles.dot} />
              Hết hàng
            </span>
          ) : isLowStock ? (
            <span className={`${styles.badge} ${styles.badgeLowStock}`}>
              <AlertTriangle className={styles.badgeIcon} />
              Sắp hết
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeInStock}`}>
              <span className={styles.dot} />
              Còn hàng
            </span>
          )}
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Tồn kho</span>
            <span className={`${styles.statValue} ${isOutOfStock ? styles.statValueMuted : isLowStock ? styles.statValueWarning : ''}`}>
              {variant.stock_qty}
            </span>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>Giá bán</span>
            <div className={styles.priceRow}>
              <span className={styles.statValue}>{Number(variant.final_price).toLocaleString('vi-VN')} VNĐ</span>
              {Number(variant.price_adjustment) !== 0 && (
                <span className={styles.adjustmentTag}>
                  {Number(variant.price_adjustment) > 0 ? '+' : ''}
                  {Number(variant.price_adjustment).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => onUpdateStock(variant)} className={styles.stockButton}>
          <RefreshCw className={styles.stockButtonIcon} />
          <span>Cập nhật tồn kho</span>
        </button>

        <button type="button" onClick={() => onEdit(variant)} className={styles.editButton} title="Sửa biến thể">
          <Edit3 className={styles.editButtonIcon} />
        </button>
      </div>
    </div>
  );
};

export default VariantCard;