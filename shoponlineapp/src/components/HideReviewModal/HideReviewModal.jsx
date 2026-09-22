import { useState } from "react";
import { EyeOff, Eye, AlertTriangle, X, Loader2 } from "lucide-react";
import styles from "./HideReviewModal.module.css";

export const HideReviewModal = ({
  isOpen,
  targetAction,
  review,
  bulkCount,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isHiding = targetAction === "HIDE";
  const isBulk = bulkCount > 1;

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={styles.closeButton}
        >
          <X />
        </button>

        <div className={styles.header}>
          <div
            className={`${styles.iconBox} ${isHiding ? styles.iconBoxRose : styles.iconBoxEmerald}`}
          >
            {isHiding ? <EyeOff /> : <Eye />}
          </div>
        </div>
        <div>
          <h3 className={styles.title}>
            {isBulk
              ? isHiding
                ? `Ẩn ${bulkCount} đánh giá đã chọn?`
                : `Hiện lại ${bulkCount} đánh giá đã chọn?`
              : isHiding
                ? "Ẩn đánh giá này?"
                : "Hiện lại đánh giá này?"}
          </h3>
          <p className={styles.subtitle}>
            {isHiding
              ? "Đánh giá sẽ không còn hiển thị công khai trên trang sản phẩm."
              : "Đánh giá sẽ hiển thị công khai trở lại trên trang sản phẩm."}
          </p>
        </div>
        {!isBulk && review && (
          <div className={styles.preview}>
            <div className={styles.previewTop}>
              <span className={styles.previewName}>
                {review.user?.full_name || review.user?.username}
              </span>
              <span className={styles.previewStars}>
                {"★".repeat(review.rating)}
              </span>
            </div>
            <p className={styles.previewComment}>"{review.comment}"</p>
          </div>
        )}

        <div className={styles.notice}>
          <AlertTriangle className={styles.noticeIcon} />
          <span>
            {isHiding
              ? "Bạn có thể hiện lại bất cứ lúc nào từ trang này."
              : "Khách hàng sẽ đọc được đánh giá và số sao ngay lập tức."}
          </span>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={styles.cancelButton}
          >
            Huỷ
          </button>
          <button
            type="button"
            id="confirm-moderation-btn"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`${styles.confirmButton} ${isHiding ? styles.confirmButtonRose : styles.confirmButtonEmerald}`}
          >
            {isSubmitting ? (
              <Loader2 className={styles.spinnerIcon} />
            ) : isHiding ? (
              <EyeOff className={styles.confirmIcon} />
            ) : (
              <Eye className={styles.confirmIcon} />
            )}
            <span>
              {isHiding
                ? isBulk
                  ? `Ẩn ${bulkCount} đánh giá`
                  : "Ẩn đánh giá"
                : isBulk
                  ? `Hiện ${bulkCount} đánh giá`
                  : "Hiện đánh giá"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HideReviewModal;
