import { Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import styles from './OrderStatusCard.module.css';

export const STATUS_CONFIGS = {
  PENDING: { key: 'PENDING', name: 'Chờ xác nhận', description: 'Đang chờ xử lý', icon: Clock, tone: 'amber' },
  PACKING: { key: 'PACKING', name: 'Đang đóng gói', description: 'Đang chuẩn bị hàng', icon: Package, tone: 'indigo' },
  SHIPPING: { key: 'SHIPPING', name: 'Đang giao', description: 'Đang trên đường giao', icon: Truck, tone: 'sky' },
  DELIVERED: { key: 'DELIVERED', name: 'Đã giao', description: 'Giao hàng thành công', icon: CheckCircle2, tone: 'emerald' },
  CANCELLED: { key: 'CANCELLED', name: 'Đã huỷ', description: 'Đơn hàng đã huỷ', icon: XCircle, tone: 'rose' },
};

export const OrderStatusCard = ({ config, count, isActive, onClick }) => {
  const Icon = config.icon;

  return (
    <button
      type="button"
      id={`order-status-card-${config.key.toLowerCase()}`}
      onClick={onClick}
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
    >
      <div className={styles.topRow}>
        <div className={`${styles.iconBox} ${styles[`tone_${config.tone}`]}`}>
          <Icon className={styles.icon} />
        </div>
        <span className={`${styles.countBadge} ${isActive ? styles.countBadgeActive : ''}`}>{count}</span>
      </div>

      <div>
        <h4 className={styles.name}>
          <span>{config.name}</span>
          <span className={`${styles.dot} ${styles[`dot_${config.tone}`]}`} />
        </h4>
        <p className={styles.desc}>{config.description}</p>
      </div>
    </button>
  );
};

export default OrderStatusCard;