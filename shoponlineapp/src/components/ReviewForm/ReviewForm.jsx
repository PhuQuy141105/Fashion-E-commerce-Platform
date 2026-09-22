import { useState, useRef } from 'react';
import { Star, Send, X, Loader2, AlertCircle, ImagePlus } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import styles from './ReviewForm.module.css';

export const ReviewForm = ({ productName, orderItemId, productId, onCancel, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (images.length + files.length > 4) {
      setError('Chỉ được tải lên tối đa 4 ảnh.');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setError(null);
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá.');
      return;
    }
    if (!comment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const url = orderItemId ? endpoints['order-item-review'](orderItemId) : endpoints['product-reviews'](productId);
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment.trim());
      images.forEach((file) => formData.append('images', file));
      const { data } = await authApis.post(url, formData);
      onSubmitted(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div id="write-review-card" className={styles.card}>
      <div className={styles.header}>
        <div>
          <h4 className={styles.title}>Viết đánh giá</h4>
          <p className={styles.subtitle}>
            Chia sẻ trải nghiệm của bạn về <strong>{productName}</strong>
          </p>
        </div>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className={styles.closeButton}>
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className={styles.label}>
            Số sao <span className={styles.required}>*</span>
          </label>
          <div className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className={styles.starButton}
                aria-label={`${star} sao`}
              >
                <Star className={`${styles.starIcon} ${star <= activeRating ? styles.starFilled : styles.starEmpty}`} />
              </button>
            ))}
            {rating > 0 && <span className={styles.ratingText}>{rating}.0 / 5</span>}
          </div>
        </div>

        <div>
          <div className={styles.commentHeader}>
            <label htmlFor="review-comment-textarea" className={styles.label}>
              Nội dung đánh giá <span className={styles.required}>*</span>
            </label>
            <span className={styles.charCount}>{comment.length}/500</span>
          </div>
          <textarea
            id="review-comment-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Chất lượng vải, form dáng, độ vừa vặn..."
            className={styles.textarea}
          />
        </div>

        <div>
          <div className={styles.commentHeader}>
            <label className={styles.label}>Ảnh đính kèm (không bắt buộc)</label>
            <span className={styles.charCount}>{images.length}/4</span>
          </div>

          <div className={styles.imagesRow}>
            {images.map((file, idx) => (
              <div key={idx} className={styles.imageThumb}>
                <img src={URL.createObjectURL(file)} alt={`Ảnh ${idx + 1}`} className={styles.imageThumbImg} />
                <button type="button" onClick={() => handleRemoveImage(idx)} className={styles.imageRemoveButton} aria-label="Xoá ảnh">
                  <X className={styles.imageRemoveIcon} />
                </button>
              </div>
            ))}

            {images.length < 4 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.imageAddButton}>
                <ImagePlus className={styles.imageAddIcon} />
                <span>Thêm ảnh</span>
              </button>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className={styles.hiddenFileInput} />
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={onCancel} disabled={isSubmitting} className={styles.cancelButton}>
            Huỷ
          </button>
          <button type="submit" id="submit-review-btn" disabled={isSubmitting} className={styles.submitButton}>
            {isSubmitting ? <Loader2 className={styles.submitIconSpin} /> : <Send className={styles.submitIcon} />}
            <span>{isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;