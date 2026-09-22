import { useState } from 'react';
import { PackageCheck, X, Loader2 } from 'lucide-react';
import styles from './ConfirmOrderDialog.module.css';

export default function ConfirmOrderDialog ({ isOpen, order, onClose, onConfirm })  {
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
      setError(err.message || 'Không thể xác nhận đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <PackageCheck />
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.closeButton}>
            <X />
          </button>
        </div>

        <h3 className={styles.title}>Xác nhận đơn hàng này?</h3>
        <p className={styles.subtitle}>
          Đơn hàng <strong>#{order.code}</strong> sẽ chuyển sang trạng thái <strong>Đang đóng gói</strong>. Hệ thống sẽ tự động
          thông báo cho shipper được gán và khách hàng.
        </p>

        <div className={styles.previewBox}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Người nhận</span>
            <span className={styles.previewValue}>{order.recipient_name}</span>
          </div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Tổng tiền</span>
            <span className={styles.previewValueBig}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.footer}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
            Để sau
          </button>
          <button type="button" onClick={handleConfirm} disabled={isSubmitting} className={styles.confirmButton}>
            {isSubmitting ? <Loader2 className={styles.spinnerIcon} /> : <PackageCheck className={styles.confirmIcon} />}
            <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận đơn'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

