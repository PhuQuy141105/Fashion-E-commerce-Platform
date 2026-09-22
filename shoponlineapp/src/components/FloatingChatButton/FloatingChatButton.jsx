import { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import styles from './FloatingChatButton.module.css';

export const FloatingChatButton = ({
  onToggle,
  unreadCount = 0,
  lastMessagePreview,
  toastTitle = 'Hỗ trợ khách hàng',
  ariaLabel = 'Mở chat với shop',
  titleAttr = 'Nhắn tin với shop',
  ctaText = 'Bấm để trả lời',
}) => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => setShowToast(true), 1500);
      return () => clearTimeout(timer);
    }
    setShowToast(false);
  }, [unreadCount, lastMessagePreview]);

  return (
    <div className={styles.wrapper}>
      {showToast && lastMessagePreview && (
        <div
          id="chat-incoming-message-toast"
          onClick={() => {
            setShowToast(false);
            onToggle();
          }}
          className={styles.toast}
        >
          <div className={styles.toastHeader}>
            <div className={styles.toastTitle}>
              <span className={styles.toastDot} />
              <span>{toastTitle}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowToast(false);
              }}
              className={styles.toastDismiss}
              aria-label="Đóng thông báo"
            >
              <X className={styles.toastDismissIcon} />
            </button>
          </div>
          <div className={styles.toastCta}>{ctaText}</div>
        </div>
      )}

      <button
        type="button"
        id="floating-live-chat-btn"
        onClick={onToggle}
        className={styles.button}
        aria-label={ariaLabel}
        title={titleAttr}
      >
        <MessageSquare className={styles.buttonIcon} />

        {unreadCount > 0 && (
          <span id="chat-unread-badge" className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChatButton;