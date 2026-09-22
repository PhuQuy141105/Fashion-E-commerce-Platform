import { Minus, X, Headset } from 'lucide-react';
import styles from './ChatHeader.module.css';

export const ChatHeader = ({ onClose, title = 'Hỗ trợ khách hàng', subtitle = 'Trò chuyện trực tiếp với shop' }) => {
  return (
    <div id="chat-widget-header" className={styles.header}>
      <div className={styles.left}>
        <div className={styles.avatar}>
          <Headset className={styles.avatarIcon} />
        </div>

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{title}</h3>
          </div>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          id="chat-header-close-btn"
          onClick={onClose}
          className={styles.actionButton}
          title="Đóng khung chat"
          aria-label="Đóng chat"
        >
          <X className={styles.actionIcon} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;