import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ArrowRight, ShoppingBag, Banknote } from 'lucide-react';
import styles from './CODSavedSuccessModal.module.css';

export const CODSavedSuccessModal = ({ isOpen, order }) => {
  const navigate = useNavigate();
  if (!isOpen || !order) return null;

  return (
    <div id="cod-success-modal-backdrop" className={styles.overlay}>
      <div id="cod-success-modal" className={styles.modal}>
        <div className={styles.iconBadge}>
          <CheckCircle2 />
        </div>

        <div className={styles.textBlock}>
          <h2 className={styles.title}>Đặt hàng thành công!</h2>
          <p className={styles.desc}>Đơn hàng của bạn đã được ghi nhận và đang chờ xử lý.</p>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Mã đơn hàng</span>
            <span className={styles.infoValueMono}>#{order.code}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Phương thức thanh toán</span>
            <span className={styles.infoValuePill}>
              <Banknote className={styles.infoIcon} />
              Thanh toán khi nhận hàng (COD)
            </span>
          </div>

          {order.expected_delivery_date && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Dự kiến giao hàng</span>
              <span className={styles.infoValueSuccess}>
                <Calendar className={styles.infoIcon} />
                {new Date(order.expected_delivery_date).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}

          <div className={styles.infoRowLast}>
            <span className={styles.infoLabel}>Tổng thanh toán</span>
            <span className={styles.infoValueBig}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" id="cod-success-view-details-btn" onClick={() => navigate('/orders')} className={styles.primaryButton}>
            <span>Xem đơn hàng của tôi</span>
            <ArrowRight className={styles.primaryButtonIcon} />
          </button>

          <button type="button" id="cod-success-continue-shopping-btn" onClick={() => navigate('/products')} className={styles.secondaryButton}>
            <ShoppingBag className={styles.secondaryButtonIcon} />
            <span>Tiếp tục mua sắm</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CODSavedSuccessModal;