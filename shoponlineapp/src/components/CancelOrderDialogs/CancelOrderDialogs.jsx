import { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader2, AlertCircle, CreditCard, Banknote, CheckCircle2, Clock3 } from 'lucide-react';
import styles from './CancelOrderDialogs.module.css';

export const CancelOrderDialogs = ({ isOpen, order, onClose, onConfirmCancel }) => {
  const [phase, setPhase] = useState('confirm'); 
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPhase('confirm');
      setReason('');
      setError(null);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const isRefundCase = order.payment_method === 'PAYOS' && order.payment?.status === 'PAID';

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirmCancel(order.id, reason.trim());
      setPhase('result');
    } catch (err) {
      setError(err.message || 'Không thể huỷ đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="cancel-order-modal-backdrop" className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {phase === 'confirm' ? (
          <>
            <div className={styles.header}>
              <div className={styles.iconBoxWarning}>
                <AlertTriangle />
              </div>
              <button type="button" disabled={isSubmitting} onClick={onClose} className={styles.closeButton} aria-label="Đóng">
                <X />
              </button>
            </div>

            <div className={styles.titleBlock}>
              <h3 id="cancel-order-dialog-title" className={styles.title}>
                Huỷ đơn hàng này?
              </h3>
              <p className={styles.subtitle}>
                {isRefundCase
                  ? 'Đơn hàng này đã được thanh toán qua PayOS. Sau khi huỷ, số tiền sẽ được hoàn lại cho bạn.'
                  : 'Bạn có chắc muốn huỷ đơn hàng này? Hành động này không thể hoàn tác.'}
              </p>
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Mã đơn hàng</span>
                <span className={styles.previewValueMono}>#{order.code}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Tổng tiền</span>
                <span className={styles.previewValueBig}>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Phương thức thanh toán</span>
                <span className={styles.previewValuePayment}>
                  {order.payment_method === 'PAYOS' ? <CreditCard className={styles.paymentIcon} /> : <Banknote className={styles.paymentIcon} />}
                  <span>{order.payment_method === 'PAYOS' ? 'PayOS' : 'Tiền mặt (COD)'}</span>
                </span>
              </div>
            </div>

            <div className={styles.reasonField}>
              <label htmlFor="cancel-reason-input" className={styles.reasonLabel}>
                Lý do huỷ (không bắt buộc)
              </label>
              <textarea
                id="cancel-reason-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Cho chúng tôi biết lý do bạn huỷ đơn..."
                rows={2}
                className={styles.reasonInput}
              />
            </div>

            {error && (
              <div id="cancel-order-error-banner" className={styles.errorBanner}>
                <AlertCircle className={styles.errorIcon} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.actionsRow}>
              <button type="button" id="keep-order-btn" disabled={isSubmitting} onClick={onClose} className={styles.keepButton}>
                Giữ đơn hàng
              </button>

              <button
                type="button"
                id="confirm-cancel-order-btn"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className={styles.confirmButton}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={styles.spinnerIcon} />
                    <span>Đang huỷ đơn...</span>
                  </>
                ) : (
                  <span>Huỷ đơn hàng</span>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {isRefundCase ? (
              <div id="cancel-order-refund-pending-result" className={styles.resultBlock}>
                <div className={styles.iconBoxRefund}>
                  <Clock3 />
                </div>
                <h3 className={styles.resultTitle}>Đã huỷ đơn hàng</h3>
                <p className={styles.resultDesc}>
                  Đơn hàng <strong>#{order.code}</strong> đã được huỷ thành công. Vui lòng chờ hoàn tiền trong ít phút.
                </p>
                <div className={styles.refundNote}>
                  Số tiền <strong>{Number(order.total_amount).toLocaleString('vi-VN')} VNĐ</strong> đang được xử lý hoàn trả về tài
                  khoản của bạn.
                </div>
              </div>
            ) : (
              <div id="cancel-order-success-result" className={styles.resultBlock}>
                <div className={styles.iconBoxSuccess}>
                  <CheckCircle2 />
                </div>
                <h3 className={styles.resultTitle}>Huỷ đơn hàng thành công</h3>
                <p className={styles.resultDesc}>
                  Đơn hàng <strong>#{order.code}</strong> đã được huỷ thành công.
                </p>
              </div>
            )}

            <button type="button" id="cancel-result-close-btn" onClick={onClose} className={styles.resultCloseButton}>
              Đóng
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CancelOrderDialogs;