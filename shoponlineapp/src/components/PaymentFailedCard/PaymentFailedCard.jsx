import { AlertCircle, RotateCcw, ArrowLeft, Clock } from 'lucide-react';
import styles from './PaymentFailedCard.module.css';

export const PaymentFailedCard = ({ status, errorMessage, onCheckAgain, onBackToCheckout }) => {
  const isPending = status === 'PENDING';

  return (
    <div id="payment-failed-card" className={styles.card}>
      <div className={`${styles.iconBadge} ${isPending ? styles.iconBadgePending : styles.iconBadgeFailed}`}>
        {isPending ? <Clock /> : <AlertCircle />}
      </div>

      <div className={styles.textBlock}>
        <span className={`${styles.statusPill} ${isPending ? styles.statusPillPending : styles.statusPillFailed}`}>
          {isPending ? 'Đang chờ xác nhận' : 'Chưa xác nhận được giao dịch'}
        </span>

        <h2 className={styles.title}>{isPending ? 'Thanh toán đang chờ xác nhận' : 'Thanh toán chưa hoàn tất'}</h2>

        <p className={styles.desc}>
          {isPending
            ? 'Ngân hàng đã ghi nhận giao dịch. Có thể mất vài phút để đồng bộ với hệ thống.'
            : errorMessage || 'Chúng tôi chưa xác nhận được thanh toán của bạn. Chưa có khoản tiền nào bị trừ.'}
        </p>
      </div>

      <div className={styles.tipsBox}>
        <span className={styles.tipsTitle}>Điều gì đã xảy ra?</span>
        <ul className={styles.tipsList}>
          <li>Cửa sổ thanh toán có thể đã bị đóng trước khi hoàn tất.</li>
          <li>Ngân hàng/ứng dụng của bạn có thể cần xác thực thêm.</li>
          <li>Bạn có thể kiểm tra lại hoặc chọn phương thức thanh toán khác.</li>
        </ul>
      </div>

      <div className={styles.actions}>
        <button type="button" id="payment-check-again-btn" onClick={onCheckAgain} className={styles.primaryButton}>
          <RotateCcw className={styles.primaryButtonIcon} />
          <span>{isPending ? 'Kiểm tra lại thanh toán' : 'Kiểm tra lại'}</span>
        </button>

        <button type="button" id="payment-back-to-checkout-btn" onClick={onBackToCheckout} className={styles.secondaryButton}>
          <ArrowLeft className={styles.secondaryButtonIcon} />
          <span>Quay lại Checkout</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentFailedCard;
