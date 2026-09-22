import { Sparkles, HelpCircle, SearchX } from 'lucide-react';
import AIRecommendationGrid from '../AIRecommendationGrid/AIRecommendationGrid';
import styles from './AIChatBubble.module.css';

export const AIChatBubble = ({ session, userName = 'Bạn', onSelectForCart, onNavigateAway }) => {
  const formattedTime = new Date(session.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const hasRecommendations = !session.needs_clarification && (session.recommendations || []).length > 0;
  const isEmpty = !session.needs_clarification && (session.recommendations || []).length === 0;

  return (
    <div className={styles.pair}>
      <div className={styles.userRow}>
        <div className={styles.userContent}>
          <div className={styles.userBubble}>
            <p>{session.query_text}</p>
          </div>
          <div className={styles.userMeta}>
            <span>{formattedTime}</span>
            <span>•</span>
            <span className={styles.userName}>{userName}</span>
          </div>
        </div>
        <div className={styles.userAvatar}>{userName.charAt(0).toUpperCase()}</div>
      </div>

      <div className={styles.aiRow}>
        <div className={styles.aiAvatar}>
          <Sparkles className={styles.aiAvatarIcon} />
        </div>

        <div className={styles.aiContent}>
          <div className={styles.aiBubble}>
            <div className={styles.aiBubbleHeader}>
              <span className={styles.aiName}>AI Stylist</span>
              <span className={styles.aiTime}>{formattedTime}</span>
            </div>

            {session.needs_clarification ? (
              <div className={styles.clarificationRow}>
                <HelpCircle className={styles.clarificationIcon} />
                <p>{session.clarification_question || 'Bạn có thể mô tả rõ hơn nhu cầu của mình không?'}</p>
              </div>
            ) : (
              <p className={styles.aiText}>
                {hasRecommendations
                  ? `Mình gợi ý ${session.recommendations.length} sản phẩm phù hợp với yêu cầu của bạn:`
                  : 'Mình chưa tìm được sản phẩm nào khớp với yêu cầu này.'}
              </p>
            )}
          </div>

          {isEmpty && (
            <div className={styles.emptyBox}>
              <div className={styles.emptyHeader}>
                <SearchX className={styles.emptyIcon} />
                <span>Không tìm thấy sản phẩm phù hợp</span>
              </div>
              <p className={styles.emptyText}>
                Thử nới lỏng tiêu chí — điều chỉnh ngân sách, màu sắc hoặc mô tả phong cách khác (vd: "Đồ công sở tối giản màu be").
              </p>
            </div>
          )}

          {hasRecommendations && (
            <AIRecommendationGrid session={session} onSelectForCart={onSelectForCart} onNavigateAway={onNavigateAway} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatBubble;