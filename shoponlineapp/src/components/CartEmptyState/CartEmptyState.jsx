import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import styles from './CartEmptyState.module.css';

export const CartEmptyState = () => {
  const navigate = useNavigate();

  return (
    <div id="cart-empty-state" className={styles.wrapper}>
      <div className={styles.iconWrapper}>
        <ShoppingBag className={styles.icon} />
      </div>

      <div className={styles.textBlock}>
        <h3 className={styles.title}>Giỏ hàng của bạn đang trống</h3>
        <p className={styles.desc}>
          Bạn chưa thêm sản phẩm nào vào giỏ hàng. Khám phá các sản phẩm mới nhất của chúng tôi ngay nhé.
        </p>
      </div>

      <button type="button" id="empty-cart-explore-btn" onClick={() => navigate('/products')} className={styles.exploreButton}>
        <span>Khám phá sản phẩm</span>
        <ArrowRight className={styles.exploreIcon} />
      </button>
    </div>
  );
};

export default CartEmptyState;