import { Sparkles, Palette, DollarSign, Shirt } from 'lucide-react';
import styles from './AIWelcomeState.module.css';

export const AIWelcomeState = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBadge}>
        <Sparkles className={styles.iconBadgeIcon} />
        
      </div>

      <div className={styles.titleBlock}>
        <h2 className={styles.title}>Bạn đang tìm trang phục như thế nào?</h2>
        <p className={styles.subtitle}>
          Mô tả dịp sử dụng, ngân sách, màu sắc yêu thích hoặc phong cách bạn muốn. AI Stylist sẽ gợi ý ngay bộ trang phục phù hợp.
        </p>
      </div>

      <div className={styles.pillars}>
        <div className={styles.pillar}>
          <div className={styles.pillarHeader}>
            <Palette className={styles.pillarIcon} />
            <span>Phối màu hài hoà</span>
          </div>
          <p className={styles.pillarDesc}>Gợi ý theo tông màu phù hợp với phong cách bạn mô tả.</p>
        </div>

        <div className={styles.pillar}>
          <div className={styles.pillarHeader}>
            <DollarSign className={styles.pillarIcon} />
            <span>Đúng ngân sách</span>
          </div>
          <p className={styles.pillarDesc}>Tuân thủ mức giá bạn đưa ra, không vượt quá.</p>
        </div>

        <div className={styles.pillar}>
          <div className={styles.pillarHeader}>
            <Shirt className={styles.pillarIcon} />
            <span>Trọn bộ trang phục</span>
          </div>
          <p className={styles.pillarDesc}>Gợi ý nhiều món phối hợp thành 1 outfit hoàn chỉnh.</p>
        </div>
      </div>
    </div>
  );
};

export default AIWelcomeState;