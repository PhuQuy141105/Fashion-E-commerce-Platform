import { Check } from 'lucide-react';
import styles from './VariantSelector.module.css';

export default function VariantSelector({
  variants = [],
  selectedSize,
  onSizeChange,
  selectedColor,
  onColorChange,
}) {
  const sizes = Array.from(
    new Set(variants.map((v) => v.size))
  ).filter(Boolean);

  const colorsForSize = Array.from(
    new Set(
      variants
        .filter(
          (v) =>
            !selectedSize ||
            v.size === selectedSize
        )
        .map((v) => v.color)
    )
  ).filter(Boolean);

  const sizeHasStock = (size) =>
    variants.some(
      (v) =>
        v.size === size &&
        v.stock_qty > 0
    );

  const colorHasStock = (colorName) =>
    variants.some(
      (v) =>
        v.color === colorName &&
        (!selectedSize ||
          v.size === selectedSize) &&
        v.stock_qty > 0
    );

  return (
    <div className={styles.variantSelector}>
      {/* Size */}
      {sizes.length > 0 && (
        <div className={styles.optionGroup}>
          <div className={styles.optionHeader}>
            <span className={styles.optionLabel}>
              Size
            </span>

            <span className={styles.optionValue}>
              {selectedSize
                ? `Đã chọn: ${selectedSize}`
                : 'Vui lòng chọn size'}
            </span>
          </div>

          <div className={styles.optionList}>
            {sizes.map((size) => {
              const isSelected =
                selectedSize === size;

              const isOutOfStock =
                !sizeHasStock(size);

              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() =>
                    onSizeChange(size)
                  }
                  className={`${styles.sizeButton} ${
                    isOutOfStock
                      ? styles.outOfStock
                      : isSelected
                      ? styles.selected
                      : styles.normal
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Màu */}
      {colorsForSize.length > 0 && (
        <div className={styles.optionGroup}>
          <div className={styles.optionHeader}>
            <span className={styles.optionLabel}>
              Màu sắc
            </span>

            <span className={styles.optionValue}>
              {selectedColor ||
                'Vui lòng chọn màu'}
            </span>
          </div>

          <div className={styles.optionList}>
            {colorsForSize.map((colorName) => {
              const isSelected =
                (selectedColor || '').toLowerCase() ===
                colorName.toLowerCase();

              const isOutOfStock =
                !colorHasStock(colorName);

              return (
                <button
                  key={colorName}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() =>
                    onColorChange(colorName)
                  }
                  className={`${styles.colorButton} ${
                    isOutOfStock
                      ? styles.outOfStock
                      : isSelected
                      ? styles.selected
                      : styles.normal
                  }`}
                >
                  <span>{colorName}</span>

                  {isSelected &&
                    !isOutOfStock && (
                      <Check
                        className={
                          styles.checkIcon
                        }
                      />
                    )}

                  {isOutOfStock && (
                    <span
                      className={
                        styles.outOfStockText
                      }
                    >
                      (hết hàng)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

