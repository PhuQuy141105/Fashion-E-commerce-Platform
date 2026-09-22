import { CheckSquare, ArrowRight, X } from 'lucide-react';
import styles from './SelectedOrdersSummaryBar.module.css';

export const SelectedOrdersSummaryBar = ({ selectedOrders, shipperName, onClearSelection, onCreateRemittance }) => {
  if (selectedOrders.length === 0) return null;

  const totalAmount = selectedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div id="cod-sticky-summary-bar" className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.iconBox}>
          <CheckSquare className={styles.icon} />
        </div>

        <div>
          <div className={styles.titleRow}>
            <span className={styles.title}>
              Đã chọn {selectedOrders.length} đơn
            </span>
            <span className={styles.separator}>-</span>
            <span className={styles.shipperText}>
              {shipperName}
            </span>
          </div>
          <p className={styles.amountText}>
            Tổng tiền COD: <strong>{totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
          </p>
        </div>
      </div>

      <div className={styles.right}>
        <button type="button" id="cod-clear-selection-btn" onClick={onClearSelection} className={styles.clearButton}>
          <X className={styles.clearIcon} />
          <span>Bỏ chọn</span>
        </button>

        <button type="button" id="cod-create-remittance-sticky-btn" onClick={onCreateRemittance} className={styles.createButton}>
          <span>Tạo đối soát</span>
          <ArrowRight className={styles.createIcon} />
        </button>
      </div>
    </div>
  );
};

export default SelectedOrdersSummaryBar;