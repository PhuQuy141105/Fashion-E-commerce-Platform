import { useState, useEffect, useMemo } from "react";
import { X, ShoppingBag, Minus, Plus, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authApis, endpoints } from "../../configs/Apis";
import { useCart } from "../../configs/Context";
import styles from "./ProductOptionModal.module.css";

export const ProductOptionModal = ({
  isOpen,
  product,
  onClose,
  onConfirmAddToCart, 
}) => {
  const { addToCart } = useCart();

  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !product) {
      return;
    }

    const loadVariants = async () => {
      setIsLoadingVariants(true);
      setError(null);
      setVariants([]);

      setSelectedSize("");
      setSelectedColor("");
      setQuantity(1);

      try {
        const response = await authApis.get(
          endpoints["product-variants"](product.id),
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        setVariants(data);

        if (data.length === 0) {
          setError("Sản phẩm hiện không có biến thể.");
        }
      } catch (err) {
        console.error("Không thể tải variants:", err);

        setError(
          "Không thể tải thông tin biến thể sản phẩm. Vui lòng thử lại.",
        );

        setVariants([]);
      } finally {
        setIsLoadingVariants(false);
      }
    };

    loadVariants();
  }, [isOpen, product]);


  const availableSizes = useMemo(() => {
    return Array.from(
      new Set(variants.map((variant) => variant.size).filter(Boolean)),
    );
  }, [variants]);

  const availableColors = useMemo(() => {
    return Array.from(
      new Set(variants.map((variant) => variant.color).filter(Boolean)),
    );
  }, [variants]);


  const selectedVariant = useMemo(() => {
    if (!variants.length) {
      return null;
    }

    return (
      variants.find(
        (variant) =>
          String(variant.size || "") === String(selectedSize) &&
          String(variant.color || "") === String(selectedColor),
      ) || null
    );
  }, [variants, selectedSize, selectedColor]);

  const isSizeAvailable = (size) => {
    return variants.some((variant) => {
      const sameSize = String(variant.size || "") === String(size);

      if (!sameSize) {
        return false;
      }

      if (!selectedColor) {
        return Number(variant.stock_qty) > 0;
      }

      return (
        String(variant.color || "") === String(selectedColor) &&
        Number(variant.stock_qty) > 0
      );
    });
  };


  const isColorAvailable = (color) => {
    return variants.some((variant) => {
      const sameColor = String(variant.color || "") === String(color);

      if (!sameColor) {
        return false;
      }

      if (!selectedSize) {
        return Number(variant.stock_qty) > 0;
      }

      return (
        String(variant.size || "") === String(selectedSize) &&
        Number(variant.stock_qty) > 0
      );
    });
  };

  const handleSizeSelect = (size) => {
    if (!isSizeAvailable(size)) {
      return;
    }

    setSelectedSize(size);
    setError(null);
    setQuantity(1);

    const compatibleVariant = variants.find(
      (variant) =>
        String(variant.size || "") === String(size) &&
        (!selectedColor ||
          String(variant.color || "") === String(selectedColor)) &&
        Number(variant.stock_qty) > 0,
    );

    if (!compatibleVariant) {
      setSelectedColor("");
    }
  };

  const handleColorSelect = (color) => {
    if (!isColorAvailable(color)) {
      return;
    }

    setSelectedColor(color);
    setError(null);
    setQuantity(1);

    const compatibleVariant = variants.find(
      (variant) =>
        String(variant.color || "") === String(color) &&
        (!selectedSize ||
          String(variant.size || "") === String(selectedSize)) &&
        Number(variant.stock_qty) > 0,
    );

    if (!compatibleVariant) {
      setSelectedSize("");
    }
  };

  const maxQuantity = selectedVariant ? Number(selectedVariant.stock_qty) : 0;

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
    setError(null);
  };

  const handleIncrement = () => {
    if (!selectedVariant) {
      setError("Vui lòng chọn size và màu sắc.");
      return;
    }

    if (quantity >= maxQuantity) {
      setError(`Chỉ còn ${maxQuantity} sản phẩm trong kho.`);
      return;
    }

    setQuantity((prev) => prev + 1);
    setError(null);
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoadingVariants || isSubmitting) {
      return;
    }

    if (!selectedSize && availableSizes.length > 0) {
      setError("Vui lòng chọn size.");
      return;
    }

    if (!selectedColor && availableColors.length > 0) {
      setError("Vui lòng chọn màu sắc.");
      return;
    }

    if (!selectedVariant) {
      setError("Tổ hợp size và màu sắc này không tồn tại hoặc đã hết hàng.");
      return;
    }

    if (maxQuantity <= 0) {
      setError("Biến thể này đã hết hàng.");
      return;
    }

    if (quantity < 1) {
      setError("Số lượng tối thiểu là 1.");
      return;
    }

    if (quantity > maxQuantity) {
      setError(`Số lượng không được vượt quá ${maxQuantity} sản phẩm.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addToCart(selectedVariant.id, quantity);

      onConfirmAddToCart?.({
        product,
        variant: selectedVariant,
        variantId: selectedVariant.id,
        quantity,
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: selectedVariant.final_price,
      });

      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Thêm vào giỏ hàng thất bại:", err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Thêm vào giỏ hàng thất bại. Vui lòng thử lại.";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return null;
  }

  const displayPrice = selectedVariant
    ? Number(selectedVariant.final_price)
    : Number(product.base_price || 0);

  const subtotal = displayPrice * quantity;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.backdrop}
          />

          <motion.div
            id="product-option-modal"
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 15,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 15,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              id="close-option-modal-btn"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Đóng"
            >
              <X className={styles.closeIcon} />
            </button>

            <form className={styles.form}>

              <div className={styles.productHeader}>
                <div className={styles.productImageWrapper}>
                  <img
                    id="option-modal-product-image"
                    src={product.thumbnail}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={styles.productImage}
                  />

                  {product.is_featured && (
                    <span className={styles.featuredBadge}>Nổi bật</span>
                  )}
                </div>

                <div className={styles.productInfo}>
                  <span id="option-modal-brand" className={styles.brandName}>
                    {product.brand?.name}
                  </span>

                  <h3
                    id="option-modal-product-name"
                    className={styles.productName}
                  >
                    {product.name}
                  </h3>

                  <div className={styles.price}>
                    <span id="option-modal-price">
                      {displayPrice.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>

                  <div className={styles.productMeta}>
                    <span>{product.category?.name}</span>

                    {product.sold_count > 0 && (
                      <>
                        <span>-</span>
                        <span>Đã bán {product.sold_count}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.divider} />


              {error && (
                <div id="option-modal-error" className={styles.error}>
                  <AlertCircle className={styles.errorIcon} />

                  <span>{error}</span>
                </div>
              )}


              {isLoadingVariants ? (
                <div className={styles.loading}>
                  Đang tải biến thể sản phẩm...
                </div>
              ) : (
                <>

                  {availableSizes.length > 0 && (
                    <div className={styles.optionSection}>
                      <div className={styles.optionHeader}>
                        <label className={styles.optionLabel}>
                          <span>Size</span>
                          <span className={styles.required}>*</span>
                        </label>

                        <span className={styles.selectedText}>
                          {selectedSize
                            ? `Đã chọn: ${selectedSize}`
                            : "Chưa chọn"}
                        </span>
                      </div>

                      <div className={styles.optionsContainer}>
                        {availableSizes.map((size) => {
                          const isSelected = selectedSize === size;

                          const isAvailable = isSizeAvailable(size);

                          return (
                            <button
                              key={size}
                              type="button"
                              id={`option-size-${size}`}
                              disabled={!isAvailable}
                              onClick={() => handleSizeSelect(size)}
                              className={`${styles.sizeButton} ${
                                isSelected ? styles.optionSelected : ""
                              } ${!isAvailable ? styles.optionDisabled : ""}`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  {availableColors.length > 0 && (
                    <div className={styles.optionSection}>
                      <div className={styles.optionHeader}>
                        <label className={styles.optionLabel}>Màu sắc</label>

                        <span className={styles.selectedText}>
                          {selectedColor
                            ? `Đã chọn ${selectedColor}`
                            : "Chưa chọn"}
                        </span>
                      </div>

                      <div className={styles.colorOptions}>
                        {availableColors.map((colorName) => {
                          const isSelected =
                            selectedColor.toLowerCase() ===
                            colorName.toLowerCase();

                          const isAvailable = isColorAvailable(colorName);

                          return (
                            <button
                              key={colorName}
                              type="button"
                              id={`option-color-${colorName}`}
                              disabled={!isAvailable}
                              onClick={() => handleColorSelect(colorName)}
                              className={`${styles.colorButton} ${
                                isSelected ? styles.optionSelected : ""
                              } ${!isAvailable ? styles.optionDisabled : ""}`}
                            >
                              <span>{colorName}</span>

                              {isSelected && (
                                <Check className={styles.checkIcon} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  <div className={styles.quantitySection}>
                    <div className={styles.optionHeader}>
                      <label className={styles.optionLabel}>Số lượng</label>

                      <span className={styles.selectedText}>
                        {selectedVariant
                          ? `Tối đa: ${maxQuantity}`
                          : "Chọn biến thể trước"}
                      </span>
                    </div>

                    <div className={styles.quantityContainer}>
                      <div className={styles.quantityControl}>
                        <button
                          type="button"
                          id="option-qty-decrease-btn"
                          disabled={!selectedVariant || quantity <= 1}
                          onClick={handleDecrement}
                          className={styles.quantityButton}
                          aria-label="Giảm số lượng"
                        >
                          <Minus className={styles.quantityIcon} />
                        </button>

                        <span
                          id="option-qty-display"
                          className={styles.quantityDisplay}
                        >
                          {quantity}
                        </span>

                        <button
                          type="button"
                          id="option-qty-increase-btn"
                          disabled={!selectedVariant || quantity >= maxQuantity}
                          onClick={handleIncrement}
                          className={styles.quantityButton}
                          aria-label="Tăng số lượng"
                        >
                          <Plus className={styles.quantityIcon} />
                        </button>
                      </div>

                      <div className={styles.subtotal}>
                        <span className={styles.subtotalLabel}>Tạm tính:</span>

                        <span className={styles.subtotalValue}>
                          {subtotal.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    </div>
                  </div>


                  <button
                    type="submit"
                    id="option-add-to-cart-btn"
                    disabled={!selectedVariant || maxQuantity <= 0 || isAdded || isSubmitting}
                    className={`${styles.addToCartButton} ${isAdded ? styles.addedToCart : ""}`}
                    onClick={handleSubmit}
                  >
                    {isAdded ? (
                      <>
                        <Check />
                        <span className={styles.addedText}>
                          <span className={styles.desktopText}>Đã thêm</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className={styles.cartIcon} />
                        <span>
                          {isSubmitting
                            ? "Đang thêm..."
                            : !selectedVariant
                            ? "Chọn biến thể"
                            : "Thêm vào giỏ hàng"}
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductOptionModal;