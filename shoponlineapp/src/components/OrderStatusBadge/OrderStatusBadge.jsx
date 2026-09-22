import { Clock, PackageCheck, Truck, CheckCircle2, XCircle } from 'lucide-react';
import styles from './OrderStatusBadge.module.css';

const CONFIG = {
  PENDING: { label: 'Chờ xác nhận', icon: Clock, tone: 'amber' },
  PACKING: { label: 'Đang đóng gói', icon: PackageCheck, tone: 'indigo' },
  SHIPPING: { label: 'Đang giao', icon: Truck, tone: 'sky' },
  DELIVERED: { label: 'Đã giao', icon: CheckCircle2, tone: 'emerald' },
  CANCELLED: { label: 'Đã huỷ', icon: XCircle, tone: 'rose' },
};

export const OrderStatusBadge = ({ status, size = 'md' }) => {
  const config = CONFIG[status] || { label: status, icon: Clock, tone: 'neutral' };
  const Icon = config.icon;

  return (
    <span className={`${styles.badge} ${styles[`tone_${config.tone}`]} ${styles[`size_${size}`]}`}>
      <Icon className={styles.icon} />
      <span>{config.label}</span>
    </span>
  );
};

export default OrderStatusBadge;