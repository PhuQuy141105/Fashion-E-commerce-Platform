import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowRight, ShoppingBag } from 'lucide-react';
import styles from './OrderSummary.module.css';

export const OrderSummary = ({ itemCount = 0, subtotal = 0, hasOutOfStockItems = false, selectedItemIds = [] }) => {
  const navigate = useNavigate();
  const isEmpty = itemCount === 0;
  const noSelection = !isEmpty && selectedItemIds.length === 0;

  const handleCheckout = () => {
    navigate('/checkout', { state: { cartItemIds: selectedItemIds } });
  };

  return (
    <div id="cart-order-summary-card" className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tóm tắt đơn hàng</h3>
        <span className={styles.itemCount}>{itemCount} sản phẩm</span>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Tạm tính</span>
          <span className={styles.rowValue}>{subtotal.toLocaleString('vi-VN')} VNĐ</span>
        </div>

        <div className={styles.note}>Phí vận chuyển sẽ được tính khi bạn chọn địa chỉ giao hàng ở bước thanh toán.</div>

        <div className={styles.totalRow}>
          <div>
            <span className={styles.totalLabel}>Tổng tạm tính</span>
          </div>
          <span id="order-summary-total-amount" className={styles.totalValue}>
            {subtotal.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
      </div>

      {hasOutOfStockItems && (
        <div className={styles.warningNotice}>
          Một số sản phẩm trong giỏ đã hết hàng — vui lòng xoá hoặc chờ hàng về trước khi thanh toán.
        </div>
      )}

      {noSelection && (
        <div className={styles.warningNotice}>Vui lòng chọn ít nhất 1 sản phẩm để tiến hành thanh toán.</div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          id="proceed-to-checkout-btn"
          disabled={isEmpty || hasOutOfStockItems || noSelection}
          onClick={handleCheckout}
          className={styles.checkoutButton}
        >
          <ShoppingBag className={styles.checkoutIcon} />
          <span>{isEmpty ? 'Giỏ hàng trống' : `Thanh toán (${selectedItemIds.length})`}</span>
          <ArrowRight className={styles.checkoutArrow} />
        </button>

        <button type="button" onClick={() => navigate('/products')} className={styles.continueButton}>
          Tiếp tục mua sắm
        </button>
      </div>

      <div className={styles.assurances}>
        <div className={styles.assuranceRow}>
          <ShieldCheck className={styles.assuranceIcon} />
          <span>Thanh toán được mã hoá & bảo mật</span>
        </div>
        <div className={styles.assuranceRow}>
          <RotateCcw className={styles.assuranceIcon} />
          <span>Đổi trả trong 30 ngày</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;