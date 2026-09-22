import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './ProductGallery.module.css';

export const ProductGallery = ({
  productImages = [],
  variants = [],
  productName,
  isFeatured,
  isOutOfStock,
  onSelectVariant,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const galleryItems = useMemo(() => {
    const items = [];
    const seen = new Set();

    (productImages || []).forEach((img, i) => {
      if (img && !seen.has(img)) {
        items.push({ key: `product-${i}`, image: img, variant: null });
        seen.add(img);
      }
    });

    (variants || []).forEach((v) => {
      const img = v.images?.[0];
      if (img && !seen.has(img)) {
        items.push({ key: `variant-${v.id}`, image: img, variant: v });
        seen.add(img);
      }
    });

    return items;
  }, [productImages, variants]);

  const placeholder = {
    key: 'placeholder',
    image: 'https://placehold.co/800x800/EFE9E3/6F6A64?text=' + encodeURIComponent(productName || 'Product'),
    variant: null,
  };
  const items = galleryItems.length > 0 ? galleryItems : [placeholder];

  useEffect(() => {
    setSelectedIndex(0);
    setIsZoomed(false);
  }, [items.length, items[0]?.image]);

  const current = items[selectedIndex] ?? items[0];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (idx) => {
    setSelectedIndex(idx);
    const item = items[idx];
    if (item?.variant && item.variant.stock_qty > 0) {
      onSelectVariant?.(item.variant);
    }
  };

  return (
    <div className={styles.gallery}>
      <div
        id="product-main-gallery-view"
        className={styles.mainView}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current.key}
            src={current.image}
            alt={`${productName}${current.variant ? ` - ${current.variant.size} ${current.variant.color}` : ''}`}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.2 }}
            className={styles.mainImage}
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              transform: isZoomed ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        </AnimatePresence>

        <div className={styles.badges}>
          {isFeatured && <span className={styles.featuredBadge}>Nổi bật</span>}
          {isOutOfStock && <span className={styles.outOfStockBadge}>Hết hàng</span>}
        </div>

        {items.length > 1 && (
          <div className={styles.navigationButtons}>
            <button type="button" onClick={handlePrev} className={styles.navButton} aria-label="Ảnh trước">
              <ChevronLeft className={styles.navIcon} />
            </button>
            <button type="button" onClick={handleNext} className={styles.navButton} aria-label="Ảnh sau">
              <ChevronRight className={styles.navIcon} />
            </button>
          </div>
        )}

        <div className={styles.mobileIndicators}>
          {items.map((item, idx) => (
            <span
              key={item.key}
              className={`${styles.indicator} ${selectedIndex === idx ? styles.activeIndicator : styles.inactiveIndicator}`}
            />
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <div className={styles.thumbnails}>
          {items.map((item, idx) => {
            const isCurrent = selectedIndex === idx;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleThumbnailClick(idx)}
                title={item.variant ? `${item.variant.size} • ${item.variant.color}` : productName}
                className={`${styles.thumbnailButton} ${isCurrent ? styles.currentThumbnail : styles.normalThumbnail}`}
              >
                <img src={item.image} alt="" referrerPolicy="no-referrer" className={styles.thumbnailImage} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;