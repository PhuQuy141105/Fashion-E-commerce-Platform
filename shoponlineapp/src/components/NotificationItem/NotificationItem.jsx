import { Package, MessageSquare, Gift, Bell, ChevronRight } from 'lucide-react';
import styles from './NotificationItem.module.css';

const TYPE_CONFIG = {
  ORDER: { icon: Package, className: 'tone_neutral' },
  CHAT: { icon: MessageSquare, className: 'tone_sky' },
  PROMOTION: { icon: Gift, className: 'tone_amber' },
  SYSTEM: { icon: Bell, className: 'tone_neutral' },
};

function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 2) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Date(isoString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export const NotificationItem = ({ item, onItemClick }) => {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.SYSTEM;
  const Icon = config.icon;

  return (
    <div
      id={`notification-item-${item.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onItemClick(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(item);
        }
      }}
      className={`${styles.item} ${!item.is_read ? styles.itemUnread : ''}`}
    >
      <div className={`${styles.iconBox} ${styles[config.className]}`}>
        <Icon className={styles.icon} />
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <h5 className={styles.title}>{item.title}</h5>
          <span className={styles.time}>{formatRelativeTime(item.created_at)}</span>
        </div>

        <p className={styles.body}>{item.body}</p>

        {item.type === 'ORDER' && item.ref_id && (
          <span className={styles.orderBadge}>
            Đơn hàng #{item.ref_id}
            <ChevronRight className={styles.orderBadgeIcon} />
          </span>
        )}
      </div>

      {!item.is_read && <span className={styles.unreadDot} title="Chưa đọc" />}
    </div>
  );
};

export default NotificationItem;