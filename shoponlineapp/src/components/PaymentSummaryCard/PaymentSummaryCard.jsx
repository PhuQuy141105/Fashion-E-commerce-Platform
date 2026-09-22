import { Sparkles, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import styles from './PaymentSummaryCard.module.css';

export const PaymentSummaryCard = ({ order }) => {
  const isPaid = order.payment?.status === 'PAID';
  const isCOD = order.payment_method === 'COD';

  return (
    <div className={styles.wrapper}>
      <section id="payment-summary-card" className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>Tóm tắt thanh toán</h3>
          <span className={`${styles.statusBadge} ${isPaid ? styles.statusBadgePaid : styles.statusBadgePending}`}>
            {isPaid ? <CheckCircle2 className={styles.statusIcon} /> : <Clock className={styles.statusIcon} />}
            <span>{isPaid ? 'Đã thanh toán' : isCOD ? 'Thanh toán khi nhận hàng' : 'Chờ thanh toán'}</span>
          </span>
        </div>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Tạm tính</span>
            <span className={styles.rowValue}>{Number(order.subtotal_amount).toLocaleString('vi-VN')} VNĐ</span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Phí vận chuyển</span>
            <span className={styles.rowValue}>{Number(order.shipping_fee).toLocaleString('vi-VN')} VNĐ</span>
          </div>

          {Number(order.discount_amount) > 0 && (
            <div className={styles.discountRow}>
              <span className={styles.discountLabel}>
                <Sparkles className={styles.discountIcon} />
                <span>Giảm giá</span>
              </span>
              <span>-{Number(order.discount_amount).toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <div>
              <span className={styles.totalLabel}>{isPaid ? 'Tổng đã thanh toán' : 'Tổng thanh toán'}</span>
              <span className={styles.totalSub}>Qua {isCOD ? 'tiền mặt (COD)' : 'PayOS'}</span>
            </div>
            <span className={styles.totalValue}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>
      </section>
      <section id="order-delivery-address-card" className={styles.card}>
        <div className={styles.addressHeader}>
          <MapPin className={styles.addressIcon} />
          <h3 className={styles.addressTitle}>Địa chỉ giao hàng</h3>
        </div>

        <div className={styles.addressBody}>
          <h4 className={styles.recipientName}>{order.recipient_name}</h4>
          <div className={styles.phoneRow}>
            <Phone className={styles.phoneIcon} />
            <span>{order.recipient_phone}</span>
          </div>
          <p className={styles.addressText}>{order.shipping_address}</p>
        </div>
      </section>
    </div>
  );
};

export default PaymentSummaryCard;