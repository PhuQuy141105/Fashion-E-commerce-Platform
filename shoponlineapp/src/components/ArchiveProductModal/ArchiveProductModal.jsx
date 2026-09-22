import { useState } from 'react';
import { AlertTriangle, X, Archive, Loader2, ImageOff } from 'lucide-react';
import styles from './ArchiveProductModal.module.css';

export const ArchiveProductModal = ({ isOpen, product, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !product) return null;

  const handleConfirm = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await onConfirm(product);
      onClose();
    } catch (err) {
      setError(err.message || 'Ngừng bán sản phẩm thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="archive-product-modal-backdrop" className={styles.overlay}>
      <div id="archive-product-modal-container" className={styles.modal}>
        <div className={styles.header}>
          <button type="button" onClick={onClose} disabled={isLoading} className={styles.closeButton}>
            <X />
          </button>
        </div>

        <div className={styles.textBlock}>
          <h3 className={styles.title}>Ngừng bán sản phẩm này?</h3>
          <p className={styles.desc}>
            Sản phẩm <strong>"{product.name}"</strong> sẽ không còn hiển thị cho khách hàng, nhưng vẫn được giữ lại trong hệ thống ở
            trạng thái ngừng bán.
          </p>
        </div>

        <div className={styles.preview}>
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} referrerPolicy="no-referrer" className={styles.previewImage} />
          ) : (
            <div className={styles.previewImagePlaceholder}>
              <ImageOff className={styles.previewImagePlaceholderIcon} />
            </div>
          )}
          <div className={styles.previewInfo}>
            <h4 className={styles.previewName}>{product.name}</h4>
            <p className={styles.previewMeta}>
              {product.brand?.name} • {Number(product.base_price).toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" id="archive-modal-cancel-btn" onClick={onClose} disabled={isLoading} className={styles.cancelButton}>
            Huỷ
          </button>

          <button type="button" id="archive-modal-confirm-btn" onClick={handleConfirm} disabled={isLoading} className={styles.confirmButton}>
            {isLoading ? (
              <>
                <Loader2 className={styles.spinnerIcon} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Archive className={styles.confirmIcon} />
                <span>Ngừng bán</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveProductModal;