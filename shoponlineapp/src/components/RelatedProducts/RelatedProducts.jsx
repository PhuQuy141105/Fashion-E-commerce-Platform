import { Sparkles, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import styles from './RelatedProducts.module.css';

export const RelatedProducts = ({
  title = 'Có thể bạn cũng thích',
  subtitle = 'Gợi ý từ cùng danh mục sản phẩm',
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
  isRecentlyViewed = false,
}) => {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return null;
  }

  const handleSelectProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.iconWrapper}>
            {isRecentlyViewed ? (
              <History className={styles.historyIcon} />
            ) : (
              <Sparkles className={styles.sparklesIcon} />
            )}
          </div>

          <div>
            <h3 className={styles.title}>
              {title}
            </h3>

            <p className={styles.subtitle}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.productGrid}>
        {products.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            onSelect={handleSelectProduct}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlistIds.includes(prod.id)}
            viewMode="grid"
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;