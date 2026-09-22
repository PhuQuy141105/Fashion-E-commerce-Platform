import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, Check } from 'lucide-react';
import StockNoticeModal from '../StockNoticeModal/StockNoticeModal';
import styles from './CartItemCard.module.css';

export const CartItemCard = ({ item, isSelected = true, onToggleSelect, onUpdateQuantity, onRequestRemove, onSelectProduct }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, message: '' });
  const navigate = useNavigate();

  const variant = item.variant || {};
  const product = variant.product || {};
  const stockQty = Number(variant.stock_qty ?? 0);
  const isOutOfStock = stockQty <= 0;
  const unitPrice = Number(variant.final_price ?? 0);
  const subtotal = Number(item.subtotal ?? unitPrice * item.quantity);

  const showNotice = (message) => setNoticeModal({ isOpen: true, message });
  const closeNotice = () => setNoticeModal({ isOpen: false, message: '' });

  const handleGoToProduct = () => {
    if (onSelectProduct) onSelectProduct(product.id);
    else if (product.id) navigate(`/products/${product.id}`);
  };

  const runUpdate = async (newQuantity) => {
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item, newQuantity);
    } catch (err) {
      showNotice(err.message || 'Cập nhật số lượng thất bại.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMinusClick = () => {
    if (item.quantity <= 1) {
      onRequestRemove(item); 
    } else {
      runUpdate(item.quantity - 1);
    }
  };

  const handlePlusClick = () => {
    if (isOutOfStock) {
      showNotice('Sản phẩm đã hết hàng.');
      return;
    }
    if (item.quantity >= stockQty) {
      showNotice(`Đã vượt số lượng tồn kho. Chỉ còn ${stockQty} sản phẩm.`);
      return;
    }
    runUpdate(item.quantity + 1);
  };

  return (
    <div id={`cart-item-${item.id}`} className={`${styles.card} ${isOutOfStock ? styles.cardOutOfStock : ''} ${isSelected ? styles.cardSelected : ''}`}>
      <div className={styles.row}>
        {onToggleSelect && (
          <button
            type="button"
            id={`cart-item-checkbox-${item.id}`}
            role="checkbox"
            aria-checked={isSelected}
            disabled={isOutOfStock}
            onClick={() => onToggleSelect(item)}
            className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}
            aria-label={`Chọn ${product.name}`}
          >
            <Check className={styles.checkboxIcon} />
          </button>
        )}

        <div className={styles.imageWrapper}>
          <img
            src={product.thumbnail}
            alt={product.name}
            referrerPolicy="no-referrer"
            className={styles.image}
          />

          {!isOutOfStock && (
            <span className={styles.stockBadge}>Số lượng kho: {stockQty}</span>
          )}

          {isOutOfStock && (
            <div className={styles.outOfStockOverlay}>
              <span>Hết hàng</span>
            </div>
          )}
        </div>
        <div className={styles.info}>
          <span className={styles.brand}>{product.brand?.name}</span>
          <h4 onClick={handleGoToProduct} className={styles.name}>
            {product.name}
          </h4>

          <div className={styles.variantTags}>
            <span className={styles.variantTag}>
              <span className={styles.variantLabel}>Màu:</span>
              <span className={styles.variantValue}>{variant.color}</span>
            </span>
            <span className={styles.variantTag}>
              <span className={styles.variantLabel}>Size:</span>
              <span className={styles.variantValue}>{variant.size}</span>
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <div className={styles.priceBlock}>
            <div className={styles.subtotal}>{subtotal.toLocaleString('vi-VN')} VNĐ</div>
            <div className={styles.unitPrice}>{unitPrice.toLocaleString('vi-VN')} VNĐ / sản phẩm</div>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.stepper}>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleMinusClick}
                className={styles.stepperButton}
                aria-label="Giảm số lượng"
              >
                <Minus className={styles.stepperIcon} />
              </button>

              <span className={styles.quantity}>{item.quantity}</span>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handlePlusClick}
                className={styles.stepperButton}
                aria-label="Tăng số lượng"
              >
                <Plus className={styles.stepperIcon} />
              </button>
            </div>

            <button
              type="button"
              id={`remove-item-${item.id}`}
              onClick={() => onRequestRemove(item)}
              className={styles.removeButton}
              aria-label="Xoá khỏi giỏ hàng"
            >
              <Trash2 className={styles.removeIcon} />
            </button>
          </div>
        </div>
      </div>

      <StockNoticeModal isOpen={noticeModal.isOpen} message={noticeModal.message} onClose={closeNotice} />
    </div>
  );
};

export default CartItemCard;