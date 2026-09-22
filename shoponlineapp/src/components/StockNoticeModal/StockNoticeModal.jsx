import { AlertTriangle, X } from 'lucide-react';
import styles from './StockNoticeModal.module.css';

export const StockNoticeModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Đóng">
          <X />
        </button>

        <div className={styles.iconBadge}>
          <AlertTriangle />
        </div>

        <h3 className={styles.title}>Không thể cập nhật số lượng</h3>
        <p className={styles.message}>{message}</p>

        <button type="button" onClick={onClose} className={styles.okButton}>
          Đã hiểu
        </button>
      </div>
    </div>
  );
};

export default StockNoticeModal;