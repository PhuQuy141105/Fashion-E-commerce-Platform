import { Calendar, DollarSign, Palette } from 'lucide-react';
import AIRecommendationCard from '../AIRecommendationCard/AIRecommendationCard';
import styles from './AIRecommendationGrid.module.css';

const OCCASION_LABEL = {
  OFFICE: 'Công sở',
  PARTY: 'Tiệc',
  CASUAL: 'Thường ngày',
  SPORT: 'Thể thao',
  DATE: 'Hẹn hò',
  WEDDING: 'Đám cưới',
  TRAVEL: 'Du lịch',
};
export const AIRecommendationGrid = ({ session, onSelectForCart, onNavigateAway }) => {
  const recommendations = session.recommendations || [];
  if (recommendations.length === 0) return null;

  const color = session.ai_requirements?.color;
  const hasBudget = session.budget_min || session.budget_max;

  return (
    <div className={styles.wrapper}>
      <div className={styles.flex}>
        {recommendations.map((rec) => (
          <AIRecommendationCard key={rec.id} recommendation={rec} onSelectForCart={onSelectForCart} onNavigateAway={onNavigateAway} />
        ))}
      </div>

      {(session.occasion || hasBudget || session.style_preference || color) && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryEyebrow}>Tiêu chí đã dùng để gợi ý</span>
          </div>

          <div className={styles.summaryGrid}>
            {session.occasion && (
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemHeader}>
                  <Calendar className={styles.summaryIcon} />
                  <span>Dịp sử dụng</span>
                </div>
                <p className={styles.summaryValue}>{OCCASION_LABEL[session.occasion] || session.occasion}</p>
              </div>
            )}

            {hasBudget && (
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemHeader}>
                  <DollarSign className={styles.summaryIcon} />
                  <span>Ngân sách</span>
                </div>
                <p className={styles.summaryValue}>
                  {session.budget_min ? `${Number(session.budget_min).toLocaleString('vi-VN')}đ` : '0đ'}
                  {' - '}
                  {session.budget_max ? `${Number(session.budget_max).toLocaleString('vi-VN')}đ` : 'không giới hạn'}
                </p>
              </div>
            )}

            {(session.style_preference || color) && (
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemHeader}>
                  <Palette className={styles.summaryIcon} />
                  <span>Phong cách</span>
                </div>
                <p className={styles.summaryValue}>
                  {[session.style_preference, color].filter(Boolean) || '—'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationGrid;