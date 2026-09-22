import { Sparkles } from 'lucide-react';
import styles from './AITypingIndicator.module.css';

export const AITypingIndicator = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.avatar}>
        <Sparkles className={styles.avatarIcon} />
      </div>

      <div className={styles.content}>
        <div className={styles.bubble}>
          <div className={styles.bubbleTop}>
            <span className={styles.bubbleText}>AI Stylist đang chọn trang phục phù hợp nhất cho bạn...</span>
            <div className={styles.dots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
          <p className={styles.bubbleSub}>Đang tìm sản phẩm phù hợp về màu sắc, kiểu dáng và ngân sách.</p>
        </div>

        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonCard} />
          <div className={`${styles.skeletonCard} ${styles.skeletonCardHideMobile}`} />
        </div>
      </div>
    </div>
  );
};

export default AITypingIndicator;