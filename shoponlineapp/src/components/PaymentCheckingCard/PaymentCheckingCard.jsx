import { ShieldCheck } from 'lucide-react';
import styles from './PaymentCheckingCard.module.css';

export const PaymentCheckingCard = () => {
  return (
    <div id="payment-checking-status-card" className={styles.card}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
        <div className={styles.spinnerIconWrapper}>
          <ShieldCheck className={styles.spinnerIcon} />
        </div>
      </div>

      <div className={styles.textBlock}>
        <h2 className={styles.title}>Đang kiểm tra trạng thái thanh toán...</h2>
        <p className={styles.desc}>Vui lòng chờ trong khi hệ thống xác nhận thanh toán của bạn với PayOS.</p>
      </div>

      <div className={styles.note}>Đang kết nối bảo mật. Vui lòng không tải lại hoặc đóng trang này.</div>
    </div>
  );
};

export default PaymentCheckingCard;