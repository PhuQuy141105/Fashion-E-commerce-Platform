import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './DeleteAddressModal.module.css';

export const DeleteAddressModal = ({ isOpen, address, hasOtherAddresses = true, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!address) return null;

  const handleConfirm = async () => {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(address);
      onClose();
    } catch (err) {
      setError(err.message || 'Xoá địa chỉ thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.backdrop}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <button id="close-delete-dialog-btn" onClick={onClose} className={styles.closeButton} aria-label="Đóng">
                <X />
              </button>
            </div>

            <h3 className={styles.title}>Xoá địa chỉ giao hàng?</h3>

            <p className={styles.subtitle}>
              Bạn có chắc muốn xoá địa chỉ này khỏi tài khoản? Hành động này không thể hoàn tác.
            </p>

            <div className={styles.addressPreview}>
              <p className={styles.previewName}>{address.recipient_name}</p>
              <p className={styles.previewText}>
                {address.detail_address}, {address.ward}, {address.district}, {address.province}
              </p>
            </div>

            {address.is_default && hasOtherAddresses && (
              <div className={styles.warningBanner}>
                <AlertTriangle className={styles.warningIcon} />
                <p>
                  <strong>Lưu ý:</strong> đây đang là địa chỉ mặc định. Sau khi xoá, hệ thống sẽ tự
                  động chuyển một địa chỉ khác thành mặc định.
                </p>
              </div>
            )}

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.footer}>
              <button
                id="cancel-delete-btn"
                type="button"
                onClick={onClose}
                disabled={deleting}
                className={styles.cancelButton}
              >
                Huỷ
              </button>

              <button
                id="confirm-delete-btn"
                type="button"
                onClick={handleConfirm}
                disabled={deleting}
                className={styles.deleteButton}
              >
                {deleting ? 'Đang xoá...' : 'Xoá địa chỉ'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAddressModal;