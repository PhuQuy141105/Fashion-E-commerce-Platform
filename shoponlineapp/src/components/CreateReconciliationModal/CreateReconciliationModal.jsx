import { useState } from 'react';
import { X, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import styles from './CreateReconciliationModal.module.css';

export const CreateReconciliationModal = ({ isOpen, shipper, selectedOrders, onClose, onConfirm }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || selectedOrders.length === 0) return null;

  const totalAmount = selectedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const shipperName = shipper?.full_name?.trim() || shipper?.username || 'Shipper';

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(note);
      setIsConfirmed(false);
      setNote('');
    } catch (err) {
      setError(err.message || 'Tạo đối soát thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div id="admin-create-reconciliation-modal" className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <CheckSquare />
            </div>
            <div>
              <h2 className={styles.title}>Xác nhận đối soát COD</h2>
              <p className={styles.subtitle}>Xác nhận đã nhận đủ số tiền COD từ shipper này.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.closeButton}>
            <X />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Shipper</span>
              <p className={styles.infoValue}>{shipperName}</p>
            </div>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Số điện thoại</span>
              <p className={styles.infoValue}>{shipper?.phone || '—'}</p>
            </div>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Số đơn hàng</span>
              <p className={styles.infoValueBig}>{selectedOrders.length} đơn</p>
            </div>
            <div className={`${styles.infoBox} ${styles.infoBoxAccent}`}>
              <span className={styles.infoLabel}>Tổng tiền COD</span>
              <p className={styles.infoValueBig}>{totalAmount.toLocaleString('vi-VN')} VNĐ</p>
            </div>
          </div>

          <div className={styles.ordersSection}>
            <div className={styles.ordersSectionHeader}>
              <span>Danh sách đơn hàng ({selectedOrders.length})</span>
            </div>
            <div className={styles.ordersList}>
              {selectedOrders.map((order) => (
                <div key={order.id} className={styles.orderRow}>
                  <div className={styles.orderRowLeft}>
                    <span className={styles.orderRowCode}>#{order.code}</span>
                    <span className={styles.orderRowCustomer}>{order.recipient_name}</span>
                  </div>
                  <span className={styles.orderRowAmount}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.noteField}>
            <label className={styles.noteLabel}>Ghi chú (không bắt buộc)</label>
            <input
              type="text"
              id="admin-cod-remittance-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã nhận đủ tiền mặt, có biên nhận"
              className={styles.noteInput}
            />
          </div>

          <div className={styles.confirmBox}>
            <label className={styles.confirmLabel}>
              <input type="checkbox" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} className={styles.confirmCheckbox} />
              <span>Tôi xác nhận đã nhận đủ số tiền COD từ shipper này</span>
            </label>
            <p className={styles.confirmHint}>
              Hành động này sẽ đánh dấu {selectedOrders.length} đơn đã chọn là đã đối soát và tạo bản ghi hoàn tiền
            </p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
            Huỷ
          </button>
          <button type="button" id="admin-confirm-reconciliation-modal-btn" onClick={handleConfirm} disabled={!isConfirmed || isSubmitting} className={styles.confirmButton}>
            {isSubmitting ? (
              <>
                <Loader2 className={styles.spinnerIcon} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckSquare className={styles.confirmIcon} />
                <span>Xác nhận đối soát</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReconciliationModal;