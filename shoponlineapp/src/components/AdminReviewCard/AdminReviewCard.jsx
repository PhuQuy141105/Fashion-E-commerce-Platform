import { Star, Eye, EyeOff, Calendar, ImageIcon } from 'lucide-react';
import styles from './AdminReviewCard.module.css';

export const AdminReviewCard = ({ review, isSelected, onToggleSelect, onRequestHide, onRequestShow, onPreviewImage }) => {
  const displayName = review.user?.full_name?.trim() || review.user?.username || 'Người dùng';

  return (
    <div id={`admin-review-card-${review.id}`} className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${review.is_hidden ? styles.cardHidden : ''}`}>
      <div className={styles.topRow}>
        <div className={styles.left}>
          <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(review.id)} className={styles.checkbox} />

          {review.user?.avatar ? (
            <img src={review.user.avatar} alt={displayName} referrerPolicy="no-referrer" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>{displayName.charAt(0).toUpperCase()}</div>
          )}

          <div className={styles.meta}>
            <h4 className={styles.name}>{displayName}</h4>
            <div className={styles.subRow}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`${styles.starIcon} ${s <= review.rating ? styles.starFilled : styles.starEmpty}`} />
                ))}
                <span className={styles.ratingNumber}>{review.rating}.0</span>
              </div>
              <span className={styles.dot}>-</span>
              <div className={styles.dateRow}>
                <Calendar className={styles.dateIcon} />
                <span>{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          {review.is_hidden ? (
            <span className={styles.badgeHidden}>
              <EyeOff className={styles.badgeIcon} />
              Đã ẩn
            </span>
          ) : (
            <span className={styles.badgeVisible}>
              <Eye className={styles.badgeIcon} />
              Hiển thị
            </span>
          )}

          {review.is_hidden ? (
            <button type="button" id={`show-review-btn-${review.id}`} onClick={() => onRequestShow(review)} className={styles.showButton}>
              <Eye className={styles.actionIcon} />
              <span>Hiện lại</span>
            </button>
          ) : (
            <button type="button" id={`hide-review-btn-${review.id}`} onClick={() => onRequestHide(review)} className={styles.hideButton}>
              <EyeOff className={styles.actionIcon} />
              <span>Ẩn đánh giá</span>
            </button>
          )}
        </div>
      </div>

      <p className={styles.comment}>{review.comment || <em className={styles.noComment}>Không có bình luận</em>}</p>

      {review.images?.length > 0 && (
        <div className={styles.imagesRow}>
          {review.images.map((img, idx) => (
            <button key={idx} type="button" onClick={() => onPreviewImage(review.images, idx)} className={styles.imageThumb}>
              <img src={img} alt={`Ảnh ${idx + 1}`} referrerPolicy="no-referrer" className={styles.imageThumbImg} />
              <ImageIcon className={styles.imageThumbIcon} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewCard;