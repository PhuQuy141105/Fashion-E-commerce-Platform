import React from "react";
import { Heart, ShoppingBag, Check, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";

export const ProductCard = ({
  product,
  onSelect,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  viewMode = "grid",
}) => {
  const navigate = useNavigate();
  const [localWishlisted, setLocalWishlisted] = React.useState(isWishlisted);

  const [isAdded, setIsAdded] = React.useState(false);

  const price = Number(product.base_price ?? 0);

  const handleCardClick = () => {
    if (onSelect) onSelect(product.id);
    navigate(`/products/${product.id}`, {
      state: {
        initialThumbnail: product.thumbnail,
      },
    });
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();

    setLocalWishlisted(!localWishlisted);

    onToggleWishlist?.(product, e);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();

    onAddToCart?.(product, e);

    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const Badges = () => (
    <div className={styles.badges}>
      {product.is_featured && (
        <span className={styles.featuredBadge}>Nổi bật</span>
      )}

      {product.sold_count > 0 && (
        <span className={styles.soldBadge}>Đã bán {product.sold_count}</span>
      )}

      {product.status === "OUT_OF_STOCK" && (
        <span className={styles.outOfStockBadge}>Hết hàng</span>
      )}
    </div>
  );

  const SizesRow = () =>
    product.available_sizes?.length > 0 && (
      <div className={styles.sizesRow}>
        {product.available_sizes.slice(0, 5).map((size) => (
          <span key={size} className={styles.sizeBadge}>
            {size}
          </span>
        ))}
      </div>
    );

  if (viewMode === "list") {
    return (
      <div
        id={`product-card-${product.id}`}
        onClick={handleCardClick}
        className={`${styles.productCard} ${styles.listCard}`}
      >
        <div className={styles.listImageWrapper}>
          <img
            src={product.thumbnail}
            alt={product.name}
            referrerPolicy="no-referrer"
            className={styles.productImage}
          />

          <Badges />
        </div>

        <div className={styles.listContent}>
          <div>
            <div className={styles.listBrandRow}>
              <span className={styles.brandName}>{product.brand?.name}</span>

              <button
                type="button"
                onClick={handleWishlistClick}
                className={`${styles.wishlistButton} ${
                  localWishlisted ? styles.wishlistActive : ""
                }`}
                aria-label="Thêm vào yêu thích"
              >
                <Heart
                  className={styles.wishlistIcon}
                  fill={localWishlisted ? "currentColor" : "none"}
                />
              </button>
            </div>

            <h3 className={styles.listProductName}>{product.name}</h3>

            <div className={styles.productMeta}>
              <Tag />

              <span>{product.category?.name}</span>

              <span className={styles.metaDot}>-</span>

              <span>Đã bán {product.sold_count}</span>
            </div>

            <SizesRow />
          </div>

          <div className={styles.listBottom}>
            <span className={styles.listPrice}>
              {price.toLocaleString("vi-VN")}VNĐ
            </span>

            <button
              type="button"
              id={`product-cart-btn-${product.id}`}
              onClick={handleAddToCart}
              className={styles.cartButton}
            >
             
                
                <>
                  <ShoppingBag />
                  <span>Thêm vào giỏ</span>
                </>
              
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className={`${styles.productCard} ${styles.gridCard}`}
    >
      <div className={styles.gridImageWrapper}>
        <img
          src={product.thumbnail}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={styles.productImage}
        />

        <button
          type="button"
          onClick={handleWishlistClick}
          className={`${styles.gridWishlistButton} ${
            localWishlisted ? styles.wishlistActive : ""
          }`}
          aria-label="Thêm vào yêu thích"
        >
          <Heart
            className={styles.wishlistIcon}
            fill={localWishlisted ? "currentColor" : "none"}
          />
        </button>

        <Badges />
      </div>

      <div className={styles.gridContent}>
        <div className={styles.gridContainer}>
          <span className={styles.gridBrand}>{product.brand?.name}</span>

          <h3 className={styles.gridProductName}>{product.name}</h3>

          {product.description && (
            <p className={styles.gridDescription}>{product.description}</p>
          )}

          <SizesRow />
        </div>

        <div className={styles.gridBottom}>
          <span className={styles.gridPrice}>
            {price.toLocaleString("vi-VN")}VNĐ
          </span>

          <button
            type="button"
            id={`product-cart-btn-${product.id}`}
            onClick={handleAddToCart}
            className={`${styles.cartButton} ${styles.gridCartButton}`}
          >
            
              <>
                <ShoppingBag />
                <span className={styles.desktopText}>Thêm</span>
              </>
            
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;