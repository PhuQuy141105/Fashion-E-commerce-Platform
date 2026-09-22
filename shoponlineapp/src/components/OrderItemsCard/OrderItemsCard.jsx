import { useState } from 'react';
import { Package, RotateCcw, Check, PenLine } from 'lucide-react';
import { useCart } from '../../configs/Context';
import WriteReviewModal from '../WriteReviewModal/WriteReviewModal';
import styles from './OrderItemsCard.module.css';

export const OrderItemsCard = ({ items }) => {
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [reviewedIds, setReviewedIds] = useState([]); 
  const [reviewModalItem, setReviewModalItem] = useState(null);

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleBuyAgain = async (item) => {
    setLoadingId(item.id);
    try {
      await addToCart(item.variant, 1);
      setAddedIds((prev) => [...prev, item.id]);
      setTimeout(() => setAddedIds((prev) => prev.filter((id) => id !== item.id)), 2000);
    } catch (err) {
      console.error('Mua lại thất bại (có thể sản phẩm đã hết hàng):', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section id="order-items-card-section" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <Package className={styles.icon} />
          </div>
          <div>
            <h3 className={styles.title}>Sản phẩm đã đặt</h3>
            <p className={styles.subtitle}>{totalItemsCount} sản phẩm trong đơn này</p>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {items.map((item) => {
          const isAdded = addedIds.includes(item.id);
          const isLoading = loadingId === item.id;
          const isReviewed = item.has_review || reviewedIds.includes(item.id);

          return (
            <div key={item.id} id={`order-item-row-${item.id}`} className={styles.row}>
              <div className={styles.left}>
                <div className={styles.imageWrapper}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.product_name} referrerPolicy="no-referrer" className={styles.image} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <Package className={styles.placeholderIcon} />
                    </div>
                  )}
                  <span className={styles.qtyBadge}>x{item.quantity}</span>
                </div>

                <div className={styles.info}>
                  <h4 className={styles.name}>{item.product_name}</h4>
                  <div className={styles.attrs}>
                    <span className={styles.attrTag}>
                      Màu: <strong>{item.color}</strong>
                    </span>
                    <span className={styles.attrTag}>
                      Size: <strong>{item.size}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.priceBlock}>
                  <div className={styles.subtotal}>{Number(item.subtotal).toLocaleString('vi-VN')} VNĐ</div>
                  <div className={styles.unitPrice}>{Number(item.unit_price).toLocaleString('vi-VN')} VNĐ x {item.quantity}</div>
                </div>

                <div className={styles.actionButtons}>
                <button
                  type="button"
                  id={`buy-again-btn-${item.id}`}
                  onClick={() => handleBuyAgain(item)}
                  disabled={isLoading}
                  className={`${styles.buyAgainButton} ${isAdded ? styles.buyAgainButtonAdded : ''}`}
                >
                  {isAdded ? <Check className={styles.buyAgainIcon} /> : <RotateCcw className={styles.buyAgainIcon} />}
                  <span>{isAdded ? 'Đã thêm' : 'Mua lại'}</span>
                </button>

                {!isReviewed && (
                  <button type="button" id={`review-btn-${item.id}`} onClick={() => setReviewModalItem(item)} className={styles.reviewButton}>
                    <PenLine className={styles.reviewIcon} />
                    <span>Đánh giá</span>
                  </button>
                )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <WriteReviewModal
        isOpen={Boolean(reviewModalItem)}
        productName={reviewModalItem?.product_name}
        orderItemId={reviewModalItem?.id}
        onClose={() => setReviewModalItem(null)}
        onSubmitted={() => {
          setReviewedIds((prev) => [...prev, reviewModalItem.id]);
          setReviewModalItem(null);
        }}
      />
    </section>
  );
};

export default OrderItemsCard;