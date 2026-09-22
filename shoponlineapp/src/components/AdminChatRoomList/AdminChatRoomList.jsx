import React from 'react';
import { MessagesSquare, Search } from 'lucide-react';
import styles from './AdminChatRoomList.module.css';

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export const AdminChatRoomList = ({ rooms, isLoading, search, onSearchChange, onSelectRoom, onClose }) => {
  const filteredRooms = rooms.filter((r) => {
    if (!search.trim()) return true;
    const name = r.customer?.full_name?.trim() || r.customer?.username || '';
    return name.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div id="admin-chat-room-list" className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Tin nhắn khách hàng</h3>
          <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm khách hàng..."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.skeletonList}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className={styles.emptyState}>
            <MessagesSquare className={styles.emptyIcon} />
            <p>{rooms.length === 0 ? 'Chưa có cuộc trò chuyện nào.' : 'Không tìm thấy khách hàng nào.'}</p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const displayName = room.customer?.full_name?.trim() || room.customer?.username || 'Khách hàng';
            const lastMsg = room.last_message;
            const hasUnread = room.unread_count > 0;

            return (
              <button
                key={room.id}
                type="button"
                id={`admin-chat-room-item-${room.id}`}
                onClick={() => onSelectRoom(room)}
                className={styles.roomItem}
              >
                <div className={styles.avatarWrapper}>
                  {room.customer?.avatar ? (
                    <img src={room.customer.avatar} alt={displayName} referrerPolicy="no-referrer" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>{displayName.charAt(0).toUpperCase()}</div>
                  )}
                  {hasUnread && <span className={styles.onlineDot} />}
                </div>

                <div className={styles.roomInfo}>
                  <div className={styles.roomTopRow}>
                    <span className={`${styles.roomName} ${hasUnread ? styles.roomNameUnread : ''}`}>{displayName}</span>
                    {lastMsg && <span className={styles.roomTime}>{formatTime(lastMsg.created_at)}</span>}
                  </div>
                  <div className={styles.roomBottomRow}>
                    <p className={`${styles.roomPreview} ${hasUnread ? styles.roomPreviewUnread : ''}`}>
                      {lastMsg ? lastMsg.content || 'Đã gửi tệp đính kèm' : 'Chưa có tin nhắn'}
                    </p>
                    {hasUnread && <span className={styles.unreadBadge}>{room.unread_count > 9 ? '9+' : room.unread_count}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminChatRoomList;