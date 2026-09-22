import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import styles from './RemoveCartItemModal.module.css';

export const RemoveCartItemModal = ({ isOpen, item, onClose, onConfirm }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !item) return null;

  const product = item.variant?.product || {};

  const handleConfirm = async () => {
    setError(null);
    setIsRemoving(true);
    try {
      await onConfirm(item);
      onClose();
    } catch (err) {
      setError(err.message || 'Xoá sản phẩm thất bại. Vui lòng thử lại.');
    } finally {
      setIsRemoving(false);
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

        <h3 className={styles.title}>Xoá khỏi giỏ hàng?</h3>
        <p className={styles.subtitle}>
          Bạn có chắc muốn xoá <strong>{product.name}</strong> ({item.variant?.color}, size{' '}
          {item.variant?.size}) khỏi giỏ hàng?
        </p>

        <div className={styles.preview}>
          <img
            src={product.thumbnail}
            alt={product.name}
            referrerPolicy="no-referrer"
            className={styles.previewImage}
          />
          <div className={styles.previewInfo}>
            <p className={styles.previewName}>{product.name}</p>
            <p className={styles.previewMeta}>
              {item.variant?.color} • Size {item.variant?.size} •{' '}
              {Number(item.variant?.final_price || 0).toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.keepButton}>
            Giữ lại
          </button>
          <button type="button" onClick={handleConfirm} disabled={isRemoving} className={styles.removeButton}>
            {isRemoving ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveCartItemModal;