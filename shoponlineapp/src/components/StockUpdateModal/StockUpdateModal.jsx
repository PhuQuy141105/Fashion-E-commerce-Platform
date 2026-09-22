import { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import styles from './StockUpdateModal.module.css';

export const StockUpdateModal = ({ isOpen, variant, productName, onClose, onConfirm }) => {
  const [stockValue, setStockValue] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (variant) {
      setStockValue(variant.stock_qty);
      setError(null);
    }
  }, [variant, isOpen]);

  if (!isOpen || !variant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stockValue === '' || Number(stockValue) < 0) {
      setError('Số lượng tồn kho phải từ 0 trở lên');
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(Number(stockValue));
      onClose();
    } catch (err) {
      setError(err.message || 'Cập nhật tồn kho thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="stock-update-modal-backdrop" className={styles.overlay}>
      <div id="stock-update-modal-container" className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <RefreshCw />
            </div>
            <div>
              <h3 className={styles.title}>Cập nhật tồn kho</h3>
              <p className={styles.subtitle}>
                {variant.color} - Size {variant.size}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.closeButton}>
            <X />
          </button>
        </div>

        <div className={styles.productInfo}>{productName}</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row2}>
            <div className={styles.currentBox}>
              <span className={styles.currentLabel}>Tồn kho hiện tại</span>
              <span className={styles.currentValue}>{variant.stock_qty} sản phẩm</span>
            </div>

            <div>
              <label className={styles.label}>Số lượng mới</label>
              <input
                type="number"
                id="new-stock-input"
                min="0"
                value={stockValue}
                onChange={(e) => {
                  setStockValue(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                autoFocus
                className={styles.input}
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}

          <p className={styles.helperText}>Thay đổi tồn kho sẽ cập nhật ngay lập tức trạng thái còn hàng cho khách hàng.</p>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
              {isSubmitting ? (
                <>
                  <Loader2 className={styles.spinnerIcon} />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <RefreshCw className={styles.saveIcon} />
                  <span>Cập nhật</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateModal;