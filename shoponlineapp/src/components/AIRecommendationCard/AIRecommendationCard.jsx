import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, Sparkles } from 'lucide-react';
import styles from './AIRecommendationCard.module.css';

export const AIRecommendationCard = ({ recommendation, onSelectForCart, onNavigateAway }) => {
  const navigate = useNavigate();
  const product = recommendation.product;

  const handleView = () => {
    navigate(`/products/${product.id}`);
    onNavigateAway?.();
  };

  const handleAdd = () => {
    onSelectForCart(product);
  };

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.imageWrapper}>
          <img src={product.thumbnail} alt={product.name} referrerPolicy="no-referrer" className={styles.image} />
          <div className={styles.badgeRow}>
            <span className={styles.brandBadge}>{product.brand?.name}</span>
            {product.category?.name && <span className={styles.categoryBadge}>{product.category.name}</span>}
          </div>
        </div>

        <div className={styles.info}>
          <h4 onClick={handleView} className={styles.name} title={product.name}>
            {product.name}
          </h4>
          <span className={styles.price}>{Number(product.base_price).toLocaleString('vi-VN')} VNĐ</span>
        </div>

        <div className={styles.reasonBox}>
          <div className={styles.reasonHeader}>
            <Sparkles className={styles.reasonIcon} />
            <span>Vì sao phù hợp?</span>
          </div>
          <p className={styles.reasonText}>{recommendation.reason}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={handleView} className={styles.viewButton}>
          <Eye className={styles.viewIcon} />
          <span>Xem</span>
        </button>

        <button type="button" onClick={handleAdd} className={styles.addButton}>
          <ShoppingBag className={styles.addIcon} />
          <span>Thêm vào giỏ</span>
        </button>
      </div>
    </div>
  );
};

export default AIRecommendationCard;