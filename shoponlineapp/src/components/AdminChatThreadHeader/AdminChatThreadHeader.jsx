import { ArrowLeft, X } from 'lucide-react';
import styles from './AdminChatThreadHeader.module.css';

export const AdminChatThreadHeader = ({ customer, onBack, onClose }) => {
  const displayName = customer?.full_name?.trim() || customer?.username || 'Khách hàng';

  return (
    <div id="admin-chat-thread-header" className={styles.header}>
      <div className={styles.left}>
        <button type="button" onClick={onBack} className={styles.backButton} aria-label="Quay lại danh sách">
          <ArrowLeft className={styles.backIcon} />
        </button>

        {customer?.avatar ? (
          <img src={customer.avatar} alt={displayName} referrerPolicy="no-referrer" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>{displayName.charAt(0).toUpperCase()}</div>
        )}

        <div className={styles.info}>
          <h3 className={styles.name}>{displayName}</h3>
          {customer?.phone && <p className={styles.subtitle}>{customer.phone}</p>}
        </div>
      </div>

      <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Đóng khung chat">
        <X className={styles.closeIcon} />
      </button>
    </div>
  );
};

export default AdminChatThreadHeader;