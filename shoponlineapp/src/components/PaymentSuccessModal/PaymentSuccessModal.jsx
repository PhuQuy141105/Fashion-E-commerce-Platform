import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShoppingBag, Zap } from 'lucide-react';
import styles from './PaymentSuccessModal.module.css';

export const PaymentSuccessModal = ({ order, payment }) => {
  const navigate = useNavigate();

  return (
    <div id="payment-success-card" className={styles.card}>
      <div className={styles.iconBadge}>
        <CheckCircle2 />
      </div>

      <div className={styles.textBlock}>
        <span className={styles.verifiedBadge}>
          <Zap className={styles.verifiedIcon} /> Giao dịch đã xác thực
        </span>
        <h2 className={styles.title}>Thanh toán thành công!</h2>
        <p className={styles.desc}>
          Thanh toán của bạn đã được xác nhận. Đơn hàng đang được chuyển tới bộ phận xử lý.
        </p>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Mã đơn hàng</span>
          <span className={styles.infoValueMono}>#{order?.code}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Phương thức thanh toán</span>
          <span className={styles.infoValuePill}>Cổng PayOS</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Trạng thái thanh toán</span>
          <span className={styles.statusPaid}>
            <CheckCircle2 className={styles.statusIcon} /> ĐÃ THANH TOÁN
          </span>
        </div>

        <div className={styles.infoRowLast}>
          <span className={styles.infoLabel}>Số tiền đã thanh toán</span>
          <span className={styles.infoValueBig}>{Number(payment?.amount ?? order?.total_amount ?? 0).toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" id="payos-success-view-details-btn" onClick={() => navigate('/orders')} className={styles.primaryButton}>
          <span>Xem đơn hàng của tôi</span>
          <ArrowRight className={styles.primaryButtonIcon} />
        </button>

        <button type="button" id="payos-success-continue-shopping-btn" onClick={() => navigate('/products')} className={styles.secondaryButton}>
          <ShoppingBag className={styles.secondaryButtonIcon} />
          <span>Tiếp tục mua sắm</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;