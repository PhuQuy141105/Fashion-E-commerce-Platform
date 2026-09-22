import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import styles from './ClearCartModal.module.css';

export const ClearCartModal = ({ isOpen, itemCount = 0, onClose, onConfirm }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError(null);
    setIsClearing(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Xoá giỏ hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          
          <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Đóng">
            <X />
          </button>
        </div>

        <h3 className={styles.title}>Xoá toàn bộ giỏ hàng?</h3>
        <p className={styles.subtitle}>
          Bạn có chắc muốn xoá tất cả <strong>{itemCount} sản phẩm</strong> khỏi giỏ hàng? Hành động này
          không thể hoàn tác.
        </p>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Huỷ
          </button>
          <button type="button" onClick={handleConfirm} disabled={isClearing} className={styles.confirmButton}>
            {isClearing ? 'Đang xoá...' : 'Xoá tất cả'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearCartModal;