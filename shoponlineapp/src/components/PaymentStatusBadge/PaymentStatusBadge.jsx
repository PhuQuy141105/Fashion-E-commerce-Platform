import { Clock, CheckCircle2, RotateCw, Undo2, XCircle, Banknote } from 'lucide-react';
import styles from './PaymentStatusBadge.module.css';

const CONFIG = {
  PENDING: { label: 'Chờ thanh toán', icon: Clock, tone: 'neutral' },
  PAID: { label: 'Đã thanh toán', icon: CheckCircle2, tone: 'emerald' },
  CANCELLED: { label: 'Đã huỷ', icon: XCircle, tone: 'rose' },
  REFUND_PENDING: { label: 'Chờ hoàn tiền', icon: RotateCw, tone: 'amber' },
  REFUNDED: { label: 'Đã hoàn tiền', icon: Undo2, tone: 'purple' },
  FAILED: { label: 'Thất bại', icon: XCircle, tone: 'rose' },
};

export const PaymentStatusBadge = ({ paymentMethod, payment, size = 'md' }) => {
  if (paymentMethod === 'COD' && !payment) {
    return (
      <span className={`${styles.badge} ${styles.tone_neutral} ${styles[`size_${size}`]}`}>
        <Banknote className={styles.icon} />
        <span>Thanh toán khi nhận hàng</span>
      </span>
    );
  }

  const config = CONFIG[payment?.status] || CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <span className={`${styles.badge} ${styles[`tone_${config.tone}`]} ${styles[`size_${size}`]}`}>
      <Icon className={styles.icon} />
      <span>{config.label}</span>
    </span>
  );
};

export default PaymentStatusBadge;