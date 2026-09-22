import styles from './CartSkeleton.module.css';

const CartItemSkeleton = () => (
  <div className={styles.itemCard}>
    <div className={styles.itemRow}>
      <div className={`${styles.bar} ${styles.image}`} />
      <div className={styles.infoLines}>
        <div className={`${styles.bar} ${styles.line1}`} />
        <div className={`${styles.bar} ${styles.line2}`} />
        <div className={styles.tagRow}>
          <div className={`${styles.bar} ${styles.tag}`} />
          <div className={`${styles.bar} ${styles.tag}`} />
        </div>
      </div>
      <div className={styles.actionLines}>
        <div className={`${styles.bar} ${styles.price}`} />
        <div className={`${styles.bar} ${styles.control}`} />
      </div>
    </div>
  </div>
);

const SummarySkeleton = () => (
  <div className={styles.summaryCard}>
    <div className={`${styles.bar} ${styles.summaryTitle}`} />
    <div className={`${styles.bar} ${styles.summaryNote}`} />
    <div className={styles.summaryRows}>
      <div className={styles.summaryRow}>
        <div className={`${styles.bar} ${styles.rowLabel}`} />
        <div className={`${styles.bar} ${styles.rowValue}`} />
      </div>
      <div className={styles.summaryRow}>
        <div className={`${styles.bar} ${styles.rowLabelLg}`} />
        <div className={`${styles.bar} ${styles.rowValueLg}`} />
      </div>
    </div>
    <div className={`${styles.bar} ${styles.button}`} />
  </div>
);

export const CartSkeleton = () => {
  return (
    <div className={styles.grid}>
      <div className={styles.itemsColumn}>
        <CartItemSkeleton />
        <CartItemSkeleton />
        <CartItemSkeleton />
      </div>
      <div className={styles.summaryColumn}>
        <SummarySkeleton />
      </div>
    </div>
  );
};

export default CartSkeleton;