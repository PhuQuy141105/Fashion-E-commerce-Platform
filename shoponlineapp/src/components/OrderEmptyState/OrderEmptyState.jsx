import { Package, ShoppingBag } from 'lucide-react';
import styles from './OrderEmptyState.module.css';

export const OrderEmptyState = ({ currentFilter, onContinueShopping, onResetFilter }) => {
  return (
    <div id="orders-empty-state-card" className={styles.card}>
      <div className={styles.iconBox}>
        <Package className={styles.icon} />
      </div>

      <div>
        <h3 className={styles.title}>Không có đơn hàng nào</h3>
        <p className={styles.desc}>
          {currentFilter === 'ALL'
            ? 'Bạn chưa đặt đơn hàng nào. Khám phá bộ sưu tập của chúng tôi ngay.'
            : 'Không có đơn hàng nào ở trạng thái này.'}
        </p>
      </div>

      <div className={styles.actions}>
        {currentFilter !== 'ALL' && onResetFilter && (
          <button type="button" onClick={onResetFilter} className={styles.resetButton}>
            Xem tất cả đơn hàng
          </button>
        )}

        <button type="button" id="orders-empty-continue-shopping-btn" onClick={onContinueShopping} className={styles.shopButton}>
          <ShoppingBag className={styles.shopIcon} />
          <span>Tiếp tục mua sắm</span>
        </button>
      </div>
    </div>
  );
};

export default OrderEmptyState;