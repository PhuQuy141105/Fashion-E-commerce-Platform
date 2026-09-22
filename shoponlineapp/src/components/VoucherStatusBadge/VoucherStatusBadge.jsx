import { CheckCircle2, Clock, Calendar, XCircle } from 'lucide-react';
import styles from './VoucherStatusBadge.module.css';

export const getVoucherDisplayStatus = (voucher) => {
  const now = new Date();
  const start = new Date(voucher.start_date);
  const end = new Date(voucher.end_date);
  if (now < start) return 'UPCOMING';
  if (now > end) return 'EXPIRED';
  if (voucher.used_count >= voucher.usage_limit) return 'USED_UP';
  return 'VALID';
};

const CONFIG = {
  VALID: { label: 'Còn hạn', icon: CheckCircle2, tone: 'emerald' },
  UPCOMING: { label: 'Chưa bắt đầu', icon: Calendar, tone: 'sky' },
  EXPIRED: { label: 'Hết hạn', icon: Clock, tone: 'neutral' },
  USED_UP: { label: 'Hết lượt', icon: XCircle, tone: 'rose' },
};

export const VoucherStatusBadge = ({ voucher, size = 'md' }) => {
  const displayStatus = getVoucherDisplayStatus(voucher);
  const config = CONFIG[displayStatus];
  const Icon = config.icon;

  return (
    <span className={`${styles.badge} ${styles[`tone_${config.tone}`]} ${styles[`size_${size}`]}`}>
      <Icon className={styles.icon} />
      <span>{config.label}</span>
    </span>
  );
};

export default VoucherStatusBadge;