import { MessageSquareQuote, Sparkles } from 'lucide-react';
import styles from './ChatEmptyState.module.css';

export const ChatEmptyState = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconBadge}>
        <MessageSquareQuote className={styles.icon} />
        <span className={styles.sparkleTag}>
          <Sparkles className={styles.sparkleIcon} />
        </span>
      </div>

      <div className={styles.textBlock}>
        <h4 className={styles.title}>Bắt đầu trò chuyện với shop</h4>
        <p className={styles.desc}>Hỏi bất cứ điều gì về đơn hàng, sản phẩm, vận chuyển hoặc đổi trả.</p>
      </div>
    </div>
  );
};

export default ChatEmptyState;