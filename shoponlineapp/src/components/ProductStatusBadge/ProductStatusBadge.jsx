import styles from './ProductStatusBadge.module.css';

export const ProductStatusBadge = ({ status }) => {
  const config = {
    ACTIVE: { label: 'Đang bán', className: 'badgeActive' },
    OUT_OF_STOCK: { label: 'Hết hàng', className: 'badgeOutOfStock' },
    DISCONTINUED: { label: 'Ngừng bán', className: 'badgeDiscontinued' },
  }[status] || { label: status, className: 'badgeDiscontinued' };

  return (
    <span className={`${styles.badge} ${styles[config.className]}`}>

      {config.label}
    </span>
  );
};


export const StockStatusBadge = ({ totalStock }) => {
  if (totalStock === 0) {
    return (
      <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>
        Hết hàng
      </span>
    );
  }
  if (totalStock < 10) {
    return (
      <span className={`${styles.badge} ${styles.badgeLowStock}`}>
        <span className={styles.dot} />
        Sắp hết ({totalStock})
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeInStock}`}>
      
       {totalStock} sản phẩm
    </span>
  );
};

export default ProductStatusBadge;