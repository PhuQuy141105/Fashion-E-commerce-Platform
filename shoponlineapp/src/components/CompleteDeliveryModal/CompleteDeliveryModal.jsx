import { useState } from 'react';
import { CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react';
import styles from './CompleteDeliveryModal.module.css';

export const CompleteDeliveryModal = ({ isOpen, order, onClose, onConfirm }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !order) return null;

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(order.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể xác nhận giao hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <CheckCircle2 />
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.closeButton}>
            <X />
          </button>
        </div>

        <h3 className={styles.title}>Xác nhận giao hàng thành công?</h3>
        <p className={styles.subtitle}>
          Đơn hàng <strong>#{order.code}</strong> sẽ chuyển sang trạng thái <strong>Đã giao</strong>. Hệ thống sẽ tự động thông
          báo cho khách hàng và Admin.
        </p>

        <div className={styles.previewBox}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Người nhận</span>
            <span className={styles.previewValue}>{order.recipient_name}</span>
          </div>
          {order.payment_method === 'COD' && (
            <div className={styles.previewRowLast}>
              <span className={styles.previewLabel}>Đã thu tiền mặt</span>
              <span className={styles.previewValueBig}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
            Để sau
          </button>
          <button type="button" id="confirm-complete-delivery-btn" onClick={handleConfirm} disabled={isSubmitting} className={styles.confirmButton}>
            {isSubmitting ? <Loader2 className={styles.spinnerIcon} /> : <CheckCircle2 className={styles.confirmIcon} />}
            <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận đã giao'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteDeliveryModal;