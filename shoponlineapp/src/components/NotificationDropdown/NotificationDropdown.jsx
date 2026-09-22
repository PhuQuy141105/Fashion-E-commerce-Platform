import { CheckCheck, Sparkles } from 'lucide-react';
import NotificationItem from '../NotificationItem/NotificationItem';
import styles from './NotificationDropdown.module.css';

export const NotificationDropdown = ({ notifications, unreadCount, isLoading, onMarkAllAsRead, onNotificationClick }) => {
  return (
    <div id="notifications-dropdown-menu" className={styles.dropdown}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h4 className={styles.title}>Thông báo</h4>
          {unreadCount > 0 && <span className={styles.unreadPill}>{unreadCount} mới</span>}
        </div>

        {unreadCount > 0 && (
          <button type="button" id="mark-all-notifications-read-btn" onClick={onMarkAllAsRead} className={styles.markAllButton}>
            <CheckCheck className={styles.markAllIcon} />
            <span>Đánh dấu đã đọc hết</span>
          </button>
        )}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.skeletonList}>
            <div className={styles.skeletonItem} />
            <div className={styles.skeletonItem} />
            <div className={styles.skeletonItem} />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((item) => <NotificationItem key={item.id} item={item} onItemClick={onNotificationClick} />)
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              W
            </div>
            <h5 className={styles.emptyTitle}>Bạn đã xem hết rồi</h5>
            <p className={styles.emptyText}>Chưa có thông báo mới. Cập nhật đơn hàng sẽ hiện ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;