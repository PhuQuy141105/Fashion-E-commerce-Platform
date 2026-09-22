import { Loader2, CheckCheck, Headset, Paperclip } from 'lucide-react';
import styles from './ChatMessageBubble.module.css';

export const ChatMessageBubble = ({ message, isOwn, showDayGroup, dayLabel, otherAvatarUrl, otherAvatarInitial }) => {
  const time = new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const resolvedAvatarUrl = otherAvatarUrl ?? message.senderAvatar;

  return (
    <div className={styles.wrapper}>
      {showDayGroup && (
        <div className={styles.dayDivider}>
          <span>{dayLabel}</span>
        </div>
      )}

      {isOwn ? (
        <div className={styles.ownRow}>
          <div className={styles.ownBubble}>
            {message.content && <p className={styles.text}>{message.content}</p>}
            {message.attachment && (
              <a href={message.attachment} target="_blank" rel="noreferrer" className={styles.attachmentLink}>
                <Paperclip className={styles.attachmentIcon} />
                <span>Xem tệp đính kèm</span>
              </a>
            )}
          </div>

          <div className={styles.ownMeta}>
            <span>{time}</span>
            {message.isOptimistic ? (
              <span className={styles.statusRow}>
                <Loader2 className={styles.statusIconSpin} />
                <span>Đang gửi...</span>
              </span>
            ) : (
              message.isRead && (
                <span className={styles.statusRow}>
                  <CheckCheck className={styles.statusIconSeen} />
                  <span>Đã xem</span>
                </span>
              )
            )}
          </div>
        </div>
      ) : (
        <div className={styles.otherRow}>
          <div className={styles.avatar}>
            {resolvedAvatarUrl ? (
              <img src={resolvedAvatarUrl} alt={message.senderName} referrerPolicy="no-referrer" className={styles.avatarImage} />
            ) : otherAvatarInitial ? (
              <span className={styles.avatarInitial}>{otherAvatarInitial}</span>
            ) : (
              <Headset className={styles.avatarIcon} />
            )}
          </div>

          <div className={styles.otherContent}>
            <div className={styles.otherBubble}>
              {message.content && <p className={styles.text}>{message.content}</p>}
              {message.attachment && (
                <a href={message.attachment} target="_blank" rel="noreferrer" className={styles.attachmentLink}>
                  <Paperclip className={styles.attachmentIcon} />
                  <span>Xem tệp đính kèm</span>
                </a>
              )}
            </div>
            <div className={styles.otherMeta}>{time}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;