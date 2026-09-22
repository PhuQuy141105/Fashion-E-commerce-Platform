import { MessageSquare, Plus, Clock, Sparkles } from 'lucide-react';
import styles from './AISessionHistory.module.css';

export const AISessionHistory = ({ sessions, activeSessionId, onSelectSession, onNewSession, onClose }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Clock className={styles.headerIcon} />
          <span>Lịch sử tư vấn</span>
        </div>

        <button
          type="button"
          id="ai-history-new-session-btn"
          onClick={() => {
            onNewSession();
            if (onClose && window.innerWidth < 640) onClose();
          }}
          className={styles.newButton}
        >
          <Plus className={styles.newButtonIcon} />
          <span>Mới</span>
        </button>
      </div>

      <div className={styles.list}>
        {sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles className={styles.emptyIcon} />
            <p>Bạn chưa có phiên tư vấn nào.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const formattedDate = new Date(session.created_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <button
                key={session.id}
                type="button"
                id={`ai-history-session-${session.id}`}
                onClick={() => {
                  onSelectSession(session);
                  if (onClose && window.innerWidth < 640) onClose();
                }}
                className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ''}`}
              >
                <MessageSquare className={`${styles.sessionIcon} ${isActive ? styles.sessionIconActive : ''}`} />
                <div className={styles.sessionText}>
                  <p className={styles.sessionTitle}>{session.query_text}</p>
                  <span className={styles.sessionDate}>{formattedDate}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className={styles.footer}>AI Stylist • RAG Engine</div>
    </div>
  );
};

export default AISessionHistory;