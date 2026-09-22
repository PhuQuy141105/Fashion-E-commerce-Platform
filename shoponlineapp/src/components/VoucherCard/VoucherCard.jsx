import { Tag, X, Info, CheckCircle2, Loader2 } from 'lucide-react';
import styles from './VoucherCard.module.css';

export const VoucherCard = ({ voucherCode, onChangeVoucherCode, isChecking, voucherValid, voucherError, discountAmount }) => {
  return (
    <section id="checkout-voucher-section" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.stepBadge}>3</div>
          <div>
            <h2 className={styles.title}>Mã giảm giá</h2>
            <p className={styles.subtitle}>Không bắt buộc</p>
          </div>
        </div>
        <Tag className={styles.tagIcon} />
      </div>

      <div className={styles.inputRow}>
        <div className={styles.inputWrapper}>
          <Tag className={styles.inputIcon} />
          <input
            id="checkout-voucher-input"
            type="text"
            value={voucherCode}
            onChange={(e) => onChangeVoucherCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã giảm giá (nếu có)"
            className={`${styles.input} ${voucherCode && voucherError ? styles.inputError : ''} ${
              voucherCode && voucherValid ? styles.inputValid : ''
            }`}
          />

          {isChecking ? (
            <Loader2 className={styles.spinnerIcon} />
          ) : (
            voucherCode && (
              <button type="button" onClick={() => onChangeVoucherCode('')} className={styles.clearButton} aria-label="Xoá mã">
                <X className={styles.clearIcon} />
              </button>
            )
          )}
        </div>
      </div>

      {voucherCode && !isChecking && voucherValid && (
        <div className={styles.successNote}>
          <CheckCircle2 className={styles.successIcon} />
          <span>
            Áp dụng mã thành công — giảm <strong>{Number(discountAmount ?? 0).toLocaleString('vi-VN')} VNĐ</strong>
          </span>
        </div>
      )}

      {voucherCode && !isChecking && voucherError && <p className={styles.errorText}>{voucherError}</p>}

      {!voucherCode && (
        <div className={styles.note}>
          <Info className={styles.noteIcon} />
          <span>Nhập mã để kiểm tra và áp dụng ngay tại đây.</span>
        </div>
      )}
    </section>
  );
};

export default VoucherCard;