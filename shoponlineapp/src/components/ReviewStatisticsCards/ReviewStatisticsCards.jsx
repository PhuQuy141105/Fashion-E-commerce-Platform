import { MessageSquare, Eye, EyeOff, Star } from 'lucide-react';
import styles from './ReviewStatisticsCards.module.css';

export const ReviewStatisticsCards = ({ reviews, selectedVisibility, onSelectVisibility, isLoading }) => {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  const total = reviews.length;
  const visible = reviews.filter((r) => !r.is_hidden).length;
  const hidden = reviews.filter((r) => r.is_hidden).length;
  const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

  const cards = [
    { id: 'ALL', label: 'Tổng đánh giá', value: total, icon: MessageSquare, tone: 'neutral', clickable: true },
    { id: 'VISIBLE', label: 'Đang hiển thị', value: visible, icon: Eye, tone: 'emerald', clickable: true },
    { id: 'HIDDEN', label: 'Đã ẩn', value: hidden, icon: EyeOff, tone: 'rose', clickable: true },
    { id: 'RATING', label: 'Điểm trung bình', value: `${avgRating.toFixed(1)} ★`, icon: Star, tone: 'amber', clickable: false },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = card.clickable && selectedVisibility === card.id;
        return (
          <div
            key={card.id}
            id={`review-stat-card-${card.id.toLowerCase()}`}
            onClick={() => card.clickable && onSelectVisibility(card.id)}
            className={`${styles.card} ${card.clickable ? styles.cardClickable : ''} ${isSelected ? styles.cardSelected : ''}`}
          >
            <div className={styles.topRow}>
              <span className={styles.label}>{card.label}</span>
              <div className={`${styles.iconBox} ${styles[`tone_${card.tone}`]}`}>
                <Icon className={styles.icon} />
              </div>
            </div>
            <h3 className={styles.value}>{card.value}</h3>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewStatisticsCards;