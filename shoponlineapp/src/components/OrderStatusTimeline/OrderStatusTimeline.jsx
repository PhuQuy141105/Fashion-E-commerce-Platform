import { Check, Truck, AlertCircle } from 'lucide-react';
import styles from './OrderStatusTimeline.module.css';

const STEP_ORDER = ['PENDING', 'PACKING', 'SHIPPING', 'DELIVERED'];
const ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};
export const OrderStatusTimeline = ({ order }) => {
  if (order.status === 'CANCELLED') {
    return (
      <div id="order-status-timeline-section" className={styles.cancelledCard}>
        <div className={styles.cancelledHeader}>
          <AlertCircle className={styles.cancelledIcon} />
          <h3 className={styles.cancelledTitle}>Đơn hàng đã huỷ</h3>
        </div>
        <p className={styles.cancelledText}>
          {order.cancel_reason ? `Lý do: ${order.cancel_reason}` : 'Đơn hàng này đã được huỷ.'}
        </p>
      </div>
    );
  }

  const currentIndex = STEP_ORDER.indexOf(order.status);
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null);
  const orderStatus = ORDER_STATUS_LABEL[order.status]
  const steps = [
    { title: 'Đặt hàng thành công', description: 'Đơn hàng đã được ghi nhận', date: formatDate(order.created_at) },
    { title: 'Đang đóng gói', description: 'Đang chuẩn bị hàng', date: null },
    { title: 'Đang giao hàng', description: 'Đơn hàng đang trên đường giao', date: formatDate(order.shipped_at) },
    { title: 'Đã giao hàng', description: 'Giao hàng thành công', date: formatDate(order.delivered_at) },
  ].map((step, idx) => ({
    ...step,
    stepState: idx < currentIndex ? 'completed' : idx === currentIndex ? 'current' : 'upcoming',
  }));

  return (
    <section id="order-status-timeline-section" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <Truck className={styles.icon} />
          </div>
          <div>
            <h3 className={styles.title}>Tiến trình đơn hàng</h3>
            <p className={styles.subtitle}>Cập nhật trạng thái xử lý đơn hàng</p>
          </div>
        </div>
        <span className={styles.statusPill}>{orderStatus}</span>
      </div>

      <div className={styles.timeline}>
        {steps.map((step, idx) => (
          <div key={idx} id={`timeline-step-${idx}`} className={styles.step}>
            <div
              className={`${styles.marker} ${
                step.stepState === 'completed' ? styles.markerCompleted : step.stepState === 'current' ? styles.markerCurrent : styles.markerUpcoming
              }`}
            >
              {step.stepState === 'completed' ? (
                <Check className={styles.markerIcon} />
              ) : step.stepState === 'current' ? (
                <span className={styles.markerPulse} />
              ) : (
                <span className={styles.markerNumber}>{idx + 1}</span>
              )}
            </div>

            <div className={styles.stepContent}>
              <div className={styles.stepTop}>
                <h4 className={`${styles.stepTitle} ${step.stepState === 'current' ? styles.stepTitleCurrent : ''}`}>{step.title}</h4>
                {step.date && <span className={styles.stepDate}>{step.date}</span>}
              </div>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OrderStatusTimeline;