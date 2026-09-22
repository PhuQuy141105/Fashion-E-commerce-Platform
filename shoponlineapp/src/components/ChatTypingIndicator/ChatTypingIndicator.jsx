import { Headset } from 'lucide-react';
import styles from './ChatTypingIndicator.module.css';

export const ChatTypingIndicator = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.avatar}>
        <Headset className={styles.avatarIcon} />
      </div>

      <div className={styles.bubble}>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <span className={styles.text}>Hỗ trợ đang nhập...</span>
      </div>
    </div>
  );
};

export default ChatTypingIndicator;