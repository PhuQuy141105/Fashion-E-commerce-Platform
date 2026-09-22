import { RotateCw } from 'lucide-react';
import styles from './RefundPendingCard.module.css';

export const RefundPendingCard = ({ payment }) => {
  if (!payment || payment.status !== 'REFUND_PENDING') return null;

  return (
    <div id="refund-pending-card" className={styles.card}>
      <div className={styles.iconBox}>
        <RotateCw className={styles.icon} />
      </div>

      <div>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Đang chờ hoàn tiền</h3>
          <span className={styles.badge}>Tự động xử lý</span>
        </div>
        <p className={styles.desc}>
          Đơn hàng đã bị huỷ sau khi thanh toán qua PayOS. Hệ thống đang tự động xử lý hoàn lại{' '}
          <strong>{Number(payment.amount).toLocaleString('vi-VN')} VNĐ</strong> cho khách hàng. Trạng thái sẽ tự cập nhật thành
          "Đã hoàn tiền" khi PayOS xác nhận hoàn tất, không cần thao tác gì thêm.
        </p>
      </div>
    </div>
  );
};

export default RefundPendingCard;