import { Lock, ArrowRight, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import styles from './CheckoutSummary.module.css';

export const CheckoutSummary = ({
  itemCount,
  subtotal,
  shippingFee,
  discountAmount,
  totalAmount,
  isLoadingPreview = false,
  previewError,
  paymentMethod,
  hasSelectedAddress,
  agreedTerms,
  onToggleTerms,
  onSubmit,
  isSubmitting = false,
}) => {
  const hasPreview = typeof totalAmount === 'number';
  const isDisabled = !agreedTerms || !hasSelectedAddress || isSubmitting || isLoadingPreview || itemCount === 0 || !hasPreview;

  return (
    <div id="checkout-sticky-summary" className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Tóm tắt đơn hàng</h3>
        <span className={styles.itemCount}>{itemCount} sản phẩm</span>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Tạm tính</span>
          <span className={styles.rowValue}>{Number(subtotal ?? 0).toLocaleString('vi-VN')} VNĐ</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Phí vận chuyển</span>
          {isLoadingPreview ? (
            <Loader2 className={styles.rowSpinner} />
          ) : typeof shippingFee === 'number' ? (
            <span className={styles.rowValue}>{Number(shippingFee).toLocaleString('vi-VN')} VNĐ</span>
          ) : (
            <span className={styles.rowValuePending}>Chọn địa chỉ để tính</span>
          )}
        </div>

        {typeof discountAmount === 'number' && discountAmount > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Giảm giá</span>
            <span className={styles.rowValueDiscount}>-{Number(discountAmount).toLocaleString('vi-VN')} VNĐ</span>
          </div>
        )}

        <div className={styles.totalRow}>
          <div>
            <span className={styles.totalLabel}>Tổng cộng</span>
            <span className={styles.totalHint}>Đã gồm phí vận chuyển</span>
          </div>
          {isLoadingPreview ? (
            <Loader2 className={styles.totalSpinner} />
          ) : (
            <span id="checkout-final-total-amount" className={styles.totalValue}>
              {hasPreview ? Number(totalAmount).toLocaleString('vi-VN') : Number(subtotal ?? 0).toLocaleString('vi-VN')} VNĐ
            </span>
          )}
        </div>
      </div>

      {previewError && <p className={styles.previewErrorText}>{previewError}</p>}

      <div className={styles.termsSection}>
        <label id="terms-conditions-label" className={styles.termsLabel}>
          <input
            id="checkout-agree-terms-checkbox"
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => onToggleTerms(e.target.checked)}
            className={styles.termsCheckbox}
          />
          <span>
            Tôi đồng ý với <strong>Điều khoản & Điều kiện</strong> và chính sách bảo mật.
          </span>
        </label>

        {!hasSelectedAddress && <p className={styles.warningText}>* Vui lòng chọn địa chỉ giao hàng ở trên.</p>}
      </div>

      <button
        type="button"
        id="checkout-submit-btn"
        onClick={onSubmit}
        disabled={isDisabled}
        className={styles.submitButton}
      >
        <Lock className={styles.submitIcon} />
        <span>
          {isSubmitting
            ? 'Đang xử lý...'
            : paymentMethod === 'COD'
            ? 'Đặt hàng'
            : 'Tiếp tục thanh toán PayOS'}
        </span>
        <ArrowRight className={styles.submitArrow} />
      </button>

      <div className={styles.assurances}>
        <div className={styles.assuranceRow}>
          <ShieldCheck className={styles.assuranceIcon} />
          <span>Cam kết chính hãng 100%</span>
        </div>
        <div className={styles.assuranceRow}>
          <Truck className={styles.assuranceIcon} />
          <span>Đóng gói cẩn thận, giao hàng an toàn</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;