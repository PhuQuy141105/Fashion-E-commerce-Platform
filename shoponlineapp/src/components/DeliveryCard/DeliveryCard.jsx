import { MapPin, Phone, Package, Banknote, CreditCard, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';
import OrderStatusBadge from '../OrderStatusBadge/OrderStatusBadge';
import PaymentStatusBadge from '../PaymentStatusBadge/PaymentStatusBadge';
import styles from './DeliveryCard.module.css';

export const DeliveryCard = ({ order, onSelect, onStartShipping, onCompleteDelivery, onCancelOrder }) => {
  const toneByStatus = { PENDING: 'amber', PACKING: 'indigo', SHIPPING: 'sky', DELIVERED: 'emerald', CANCELLED: 'rose' };
  const tone = toneByStatus[order.status] || 'amber';

  return (
    <div id={`delivery-card-${order.id}`} className={`${styles.card} ${styles[`accent_${tone}`]}`}>
      <div className={styles.topRow} onClick={() => onSelect(order)} role="button" tabIndex={0}>
        <div className={styles.codeBlock}>
          <span className={styles.code}>#{order.code}</span>
          <span className={styles.itemCount}>{order.item_count ?? 0} sản phẩm</span>
        </div>
        <OrderStatusBadge status={order.status} size="sm" />
      </div>

      <div className={styles.body} onClick={() => onSelect(order)} role="button" tabIndex={0}>
        <div className={styles.infoRow}>
          <Phone className={styles.infoIcon} />
          <span className={styles.recipientName}>{order.recipient_name}</span>
          <span className={styles.recipientPhone}>{order.recipient_phone}</span>
        </div>

        {order.shipping_address && (
          <div className={styles.infoRow}>
            <MapPin className={styles.infoIcon} />
            <span className={styles.address}>{order.shipping_address}</span>
          </div>
        )}

        <div className={styles.metaRow}>
          <div className={styles.paymentTag}>
            {order.payment_method === 'COD' ? <Banknote className={styles.paymentIcon} /> : <CreditCard className={styles.paymentIcon} />}
            <span>{order.payment_method === 'COD' ? 'Thu hộ COD' : 'Đã thanh toán'}</span>
          </div>
          <PaymentStatusBadge paymentMethod={order.payment_method} payment={order.payment} size="sm" />
        </div>

        <div className={styles.amountRow}>
          <span className={styles.amountLabel}>{order.payment_method === 'COD' ? 'Cần thu' : 'Tổng tiền'}</span>
          <span className={styles.amountValue}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>

      {(order.status === 'PACKING' || order.status === 'SHIPPING') && (
        <div className={styles.actions}>
          {order.status === 'PACKING' && (
            <button type="button" id={`delivery-start-btn-${order.id}`} onClick={() => onStartShipping(order)} className={styles.startButton}>
              <PackageCheck className={styles.actionIcon} />
              <span>Nhận đơn & bắt đầu giao</span>
            </button>
          )}

          {order.status === 'SHIPPING' && (
            <>
              <button type="button" id={`delivery-complete-btn-${order.id}`} onClick={() => onCompleteDelivery(order)} className={styles.completeButton}>
                <CheckCircle2 className={styles.actionIcon} />
                <span>Giao thành công</span>
              </button>
              <button
                type="button"
                id={`delivery-cancel-btn-${order.id}`}
                onClick={() => onCancelOrder(order)}
                className={styles.cancelButton}
                aria-label="Huỷ đơn"
                title="Huỷ đơn"
              >
                <XCircle className={styles.actionIcon} />
                Hủy đơn
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryCard;