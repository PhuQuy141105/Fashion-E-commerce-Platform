import styles from "./AddressSkeleton.module.css";

export const AddressSkeleton = () => {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.card}>
          <div>
            <div className={styles.topRow}>
              <div className={`${styles.bar} ${styles.barTitle}`} />
              <div className={`${styles.bar} ${styles.barPill}`} />
            </div>
            <div className={styles.lines}>
              <div className={`${styles.bar} ${styles.line1}`} />
              <div className={`${styles.bar} ${styles.line2}`} />
              <div className={`${styles.bar} ${styles.line3}`} />
            </div>
          </div>
          <div className={styles.footerRow}>
            <div className={`${styles.bar} ${styles.footerLabel}`} />
            <div className={styles.footerActions}>
              <div className={`${styles.bar} ${styles.footerButton}`} />
              <div className={`${styles.bar} ${styles.footerIcon}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddressSkeleton;
