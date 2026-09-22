import { RotateCcw, FileText, Check } from 'lucide-react';
import styles from './CODSuccessModal.module.css';

export const CODSuccessModal = ({ isOpen, remittance, onClose, onViewHistory }) => {
  if (!isOpen || !remittance) return null;

  const shipperName = remittance.shipper?.full_name?.trim() || remittance.shipper?.username || 'Shipper';

  return (
    <div className={styles.overlay}>
      <div id="admin-cod-success-modal" className={styles.modal}>
        <div className={styles.iconBox}>
          <Check className={styles.icon} />
        </div>

        <h2 className={styles.title}>Đối soát thành công</h2>
        <p className={styles.desc}>Đã xác nhận và ghi nhận khoản tiền COD từ shipper.</p>

        <div className={styles.summaryCard}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Mã đối soát</span>
            <span className={styles.rowValueMono}>#{remittance.id}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Shipper</span>
            <span className={styles.rowValue}>{shipperName}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Số đơn hàng</span>
            <span className={styles.rowValue}>{remittance.items?.length ?? 0} đơn</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Tổng tiền</span>
            <span className={styles.rowValueBig}>{Number(remittance.total_amount).toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <div className={styles.rowLast}>
            <span className={styles.rowLabel}>Thời gian</span>
            <span className={styles.rowValue}>{new Date(remittance.remitted_at).toLocaleString('vi-VN')}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" id="admin-cod-view-history-modal-btn" onClick={onViewHistory} className={styles.primaryButton}>
            <FileText className={styles.primaryIcon} />
            <span>Xem lịch sử đối soát</span>
          </button>
          <button type="button" id="admin-cod-back-modal-btn" onClick={onClose} className={styles.secondaryButton}>
            <RotateCcw className={styles.secondaryIcon} />
            <span>Quay lại trang đối soát</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CODSuccessModal;