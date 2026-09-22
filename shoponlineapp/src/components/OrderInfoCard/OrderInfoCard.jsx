import { useState } from 'react';
import { Calendar, CreditCard, Banknote, Clock, CheckCircle2, AlertCircle, Truck, Copy, Check, Package } from 'lucide-react';
import styles from './OrderInfoCard.module.css';

const ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const ORDER_STATUS_BADGE = {
  PENDING: 'amber',
  PACKING: 'indigo',
  SHIPPING: 'sky',
  DELIVERED: 'emerald',
  CANCELLED: 'rose',
};

const PAYMENT_STATUS_LABEL = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã huỷ',
  REFUND_PENDING: 'Đang chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thất bại',
};

const PAYMENT_STATUS_TONE = {
  PENDING: 'amber',
  PAID: 'emerald',
  CANCELLED: 'rose',
  REFUND_PENDING: 'amber',
  REFUNDED: 'emerald',
  FAILED: 'rose',
};

export const OrderInfoCard = ({ order }) => {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = () => {
    navigator.clipboard?.writeText(order.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orderTone = ORDER_STATUS_BADGE[order.status] || 'default';
  const orderStatus = ORDER_STATUS_LABEL[order.status]
  const paymentTone = order.payment ? PAYMENT_STATUS_TONE[order.payment.status] : order.payment_method === 'COD' ? 'amber' : 'default';
  const paymentLabel = order.payment
    ? PAYMENT_STATUS_LABEL[order.payment.status]
    : order.payment_method === 'COD'
    ? 'Thanh toán khi nhận hàng'
    : 'PAYOS';

  return (
    <section id="order-info-header-card" className={styles.card}>
      <div className={styles.topRow}>
        <div>
          <div className={styles.codeRow}>
            <span className={styles.codeLabel}>Mã đơn hàng</span>
            <div className={styles.codeBox}>
              <span className={styles.codeValue}>#{order.code}</span>
              <button type="button" onClick={handleCopy} className={styles.copyButton} title="Sao chép mã đơn">
                {copied ? <Check className={styles.copyIconSuccess} /> : <Copy className={styles.copyIcon} />}
              </button>
            </div>
          </div>

          <div className={styles.dateRow}>
            <Calendar className={styles.dateIcon} />
            <span>Đặt lúc {formattedDate}</span>
          </div>
        </div>

        <div className={styles.badgeGroup}>
          <span className={`${styles.statusBadge} ${styles[`tone_${orderTone}`]}`}>
            <Package className={styles.statusBadgeIcon} />
            <span>Đơn hàng: {orderStatus}</span>
          </span>

          <span className={`${styles.statusBadge} ${styles[`tone_${paymentTone}`]}`}>
            {paymentTone === 'emerald' ? <CheckCircle2 className={styles.statusBadgeIcon} /> : paymentTone === 'rose' ? <AlertCircle className={styles.statusBadgeIcon} /> : <Clock className={styles.statusBadgeIcon} />}
            <span>Thanh toán: {paymentLabel}</span>
          </span>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Phương thức thanh toán</span>
          <div className={styles.metaValue}>
            {order.payment_method === 'COD' ? (
              <>
                <Banknote className={styles.metaIcon} />
                <span>Tiền mặt khi nhận hàng (COD)</span>
              </>
            ) : (
              <>
                <CreditCard className={styles.metaIcon} />
                <span>Cổng thanh toán PayOS</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>Dự kiến giao hàng</span>
          <div className={`${styles.metaValue} ${styles.metaValueEmerald}`}>
            <Truck className={styles.metaIconEmerald} />
            <span>
              {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderInfoCard;