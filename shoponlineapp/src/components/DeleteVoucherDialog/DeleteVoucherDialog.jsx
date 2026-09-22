import { useState } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';
import styles from './DeleteVoucherDialog.module.css';

export const DeleteVoucherDialog = ({ isOpen, voucher, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !voucher) return null;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm(voucher.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Xoá voucher thất bại. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <Trash2 />
          </div>
          <button type="button" onClick={onClose} disabled={isDeleting} className={styles.closeButton}>
            <X />
          </button>
        </div>

        <h3 className={styles.title}>Xoá voucher này?</h3>
        <p className={styles.subtitle}>
          Sau khi xoá, khách hàng sẽ không thể áp dụng mã này ở checkout nữa. Hành động này không thể hoàn tác.
        </p>

        <div className={styles.previewBox}>
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Mã voucher</span>
            <span className={styles.previewCode}>{voucher.code}</span>
          </div>
          <div className={styles.previewRowLast}>
            <span className={styles.previewLabel}>Đã sử dụng</span>
            <span className={styles.previewValue}>
              {voucher.used_count} / {voucher.usage_limit} lượt
            </span>
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.footer}>
          <button type="button" onClick={onClose} disabled={isDeleting} className={styles.cancelButton}>
            Huỷ
          </button>
          <button type="button" id="confirm-delete-voucher-btn" onClick={handleDelete} disabled={isDeleting} className={styles.deleteButton}>
            {isDeleting ? <Loader2 className={styles.spinnerIcon} /> : <Trash2 className={styles.deleteIcon} />}
            <span>Xoá voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteVoucherDialog;