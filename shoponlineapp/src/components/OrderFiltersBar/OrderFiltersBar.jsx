import { Search, Filter, RotateCcw, User, CreditCard } from 'lucide-react';
import styles from './OrderFiltersBar.module.css';

export const OrderFiltersBar = ({ filters, onApplyFilters, onResetFilters, fields = ['orderCode', 'recipientName', 'paymentMethod', 'status'] }) => {
  const showOrderCode = fields.includes('orderCode');
  const showRecipientName = fields.includes('recipientName');
  const showPaymentMethod = fields.includes('paymentMethod');
  const showStatus = fields.includes('status');

  const isFiltered =
    (showOrderCode && Boolean(filters.orderCode.trim())) ||
    (showRecipientName && Boolean(filters.recipientName.trim())) ||
    (showPaymentMethod && filters.paymentMethod !== 'ALL') ||
    (showStatus && filters.status !== 'ALL');

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Filter className={styles.headerIcon} />
          <h2 className={styles.headerTitle}>Tìm kiếm & Lọc đơn hàng</h2>
        </div>
        {isFiltered && <span className={styles.activeTag}>Đang lọc</span>}
      </div>

      <div className={styles.grid}>
        {showOrderCode && (
        <div>
          <label className={styles.label}>Mã đơn hàng</label>
          <div className={styles.inputWrapper}>
            <Search className={styles.inputIcon} />
            <input
              type="text"
              id="admin-filter-order-code"
              value={filters.orderCode}
              onChange={(e) => onApplyFilters({ orderCode: e.target.value })}
              placeholder="VD: DH1788..."
              className={styles.input}
            />
          </div>
        </div>
        )}

        {showRecipientName && (
        <div>
          <label className={styles.label}>Tên người nhận</label>
          <div className={styles.inputWrapper}>
            <User className={styles.inputIcon} />
            <input
              type="text"
              id="admin-filter-recipient-name"
              value={filters.recipientName}
              onChange={(e) => onApplyFilters({ recipientName: e.target.value })}
              placeholder="Tìm theo tên người nhận..."
              className={styles.input}
            />
          </div>
        </div>
        )}

        {showPaymentMethod && (
        <div>
          <label className={styles.label}>Phương thức thanh toán</label>
          <div className={styles.inputWrapper}>
            <CreditCard className={styles.inputIcon} />
            <select
              id="admin-filter-payment-method"
              value={filters.paymentMethod}
              onChange={(e) => onApplyFilters({ paymentMethod: e.target.value })}
              className={`${styles.select} ${styles.selectWithIcon}`}
            >
              <option value="ALL">Tất cả phương thức</option>
              <option value="COD">Tiền mặt (COD)</option>
              <option value="PAYOS">PayOS</option>
            </select>
          </div>
        </div>
        )}

        {showStatus && (
        <div>
          <label className={styles.label}>Trạng thái đơn hàng</label>
          <select
            id="admin-filter-order-status"
            value={filters.status}
            onChange={(e) => onApplyFilters({ status: e.target.value })}
            className={styles.select}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="PACKING">Đang đóng gói</option>
            <option value="SHIPPING">Đang giao</option>
            <option value="DELIVERED">Đã giao</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>
        </div>
        )}
      </div>

      {isFiltered && (
        <div className={styles.footer}>
          <button type="button" id="admin-reset-filters-btn" onClick={onResetFilters} className={styles.resetButton}>
            <RotateCcw className={styles.resetIcon} />
            <span>Xoá bộ lọc</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderFiltersBar;