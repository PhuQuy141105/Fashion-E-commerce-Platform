import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './DuplicatedAddressModal.module.css';

export const DuplicateAddressModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="duplicate-address-modal-overlay" className={styles.overlay}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.backdrop}
          />

          <motion.div
            id="duplicate-address-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              id="close-duplicate-address-modal-btn"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Đóng"
            >
              <X className={styles.closeIcon} />
            </button>

            <div id="duplicate-address-icon" className={styles.iconBadge}>
              <AlertCircle className={styles.icon} />
            </div>

            <h3 id="duplicate-address-modal-title" className={styles.title}>
              Địa chỉ đã có trong danh sách
            </h3>

            <p id="duplicate-address-modal-desc" className={styles.desc}>
              Thông tin địa chỉ giao hàng này đã trùng khớp hoàn toàn với một địa chỉ đã tồn tại
              trong danh bạ của bạn.
            </p>

            <button type="button" id="duplicate-address-ok-btn" onClick={onClose} className={styles.okButton}>
              OK
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DuplicateAddressModal;