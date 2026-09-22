import ReviewForm from '../ReviewForm/ReviewForm';
import styles from './WriteReviewModal.module.css';

export const WriteReviewModal = ({ isOpen, productName, orderItemId, onClose, onSubmitted }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        <ReviewForm productName={productName} orderItemId={orderItemId} onCancel={onClose} onSubmitted={onSubmitted} />
      </div>
    </div>
  );
};

export default WriteReviewModal;