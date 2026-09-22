import styles from './CheckoutItems.module.css';

export const CheckoutItems = ({ items }) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section id="checkout-order-items-section" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.stepBadge}>2</div>
          <div>
            <h2 className={styles.title}>Sản phẩm đặt hàng</h2>
            <p className={styles.subtitle}>Kiểm tra lại các sản phẩm trong đơn này</p>
          </div>
        </div>

        <span className={styles.countBadge}>
          {totalQuantity} sản phẩm
        </span>
      </div>

      <div className={styles.list}>
        {items.map((item) => {
          const product = item.variant?.product || {};
          const unitPrice = Number(item.variant?.final_price ?? 0);
          const subtotal = Number(item.subtotal ?? unitPrice * item.quantity);

          return (
            <div key={item.id} id={`checkout-item-${item.id}`} className={styles.row}>
              <div className={styles.left}>
                <div className={styles.imageWrapper}>
                  <img src={product.thumbnail} alt={product.name} referrerPolicy="no-referrer" className={styles.image} />
                  <span className={styles.qtyBadge}>x{item.quantity}</span>
                </div>

                <div className={styles.info}>
                  <span className={styles.brand}>{product.brand?.name}</span>
                  <h3 className={styles.name}>{product.name}</h3>
                  <div className={styles.attrs}>
                    <span className={styles.attrTag}>
                      Màu: <strong>{item.variant?.color}</strong>
                    </span>
                    <span className={styles.attrTag}>
                      Size: <strong>{item.variant?.size}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.subtotal}>{subtotal.toLocaleString('vi-VN')} VNĐ</div>
                <div className={styles.unitPrice}>
                  {unitPrice.toLocaleString('vi-VN')} VNĐ x {item.quantity}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CheckoutItems;