import { useState } from 'react';
import { Star, CheckCircle2, X, ZoomIn } from 'lucide-react';
import styles from './ReviewCard.module.css';

export const ReviewCard = ({ review }) => {
  const authorName = (review.user?.full_name || '').trim() || review.user?.email || 'Khách hàng';
  const avatarUrl = review.user?.avatar || null;
  const date = review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : '';
  const images = review.images || [];
  const [lightboxImage, setLightboxImage] = useState(null);
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.authorSection}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={authorName}
              referrerPolicy="no-referrer"
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className={styles.authorInfo}>
              <span className={styles.authorName}>
                {authorName}
              </span>

              {review.is_verified_purchase && (
                <span className={styles.verifiedBadge}>
                  <CheckCircle2 className={styles.verifiedIcon} />
                  <span>Đã mua hàng</span>
                </span>
              )}
            </div>

            <span className={styles.date}>
              {date}
            </span>
          </div>
        </div>

        <div className={styles.rating}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`${styles.star} ${
                i < review.rating
                  ? styles.starFilled
                  : styles.starEmpty
              }`}
            />
          ))}
        </div>
      </div>

      <p className={styles.comment}>
        {review.comment}
      </p>

      {images.length > 0 && (
        <div className={styles.imagesRow}>
          {images.map((imgUrl, idx) => (
            <button key={idx} type="button" onClick={() => setLightboxImage(imgUrl)} className={styles.imageThumb}>
              <img src={imgUrl} alt={`Ảnh đánh giá ${idx + 1}`} referrerPolicy="no-referrer" className={styles.imageThumbImg} />
              <span className={styles.imageZoomOverlay}>
                <ZoomIn className={styles.imageZoomIcon} />
              </span>
            </button>
          ))}
        </div>
      )}

      {lightboxImage && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxImage(null)}>
          <button type="button" onClick={() => setLightboxImage(null)} className={styles.lightboxClose} aria-label="Đóng">
            <X />
          </button>
          <img src={lightboxImage} alt="Ảnh đánh giá phóng to" referrerPolicy="no-referrer" className={styles.lightboxImage} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ReviewCard;