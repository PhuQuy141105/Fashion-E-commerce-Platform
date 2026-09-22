import { Minus, Plus } from 'lucide-react';

import styles from './QuantitySelector.module.css';

export const QuantitySelector = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 10,
}) => {
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className={styles.container}>
      <span className={styles.label}>
        Số lượng
      </span>

      <div
        id="quantity-selector-control"
        className={styles.control}
      >
        <button
          type="button"
          id="qty-decrease-btn"
          disabled={quantity <= min}
          onClick={handleDecrement}
          className={styles.button}
          aria-label="Giảm số lượng"
        >
          <Minus className={styles.icon} />
        </button>

        <span
          id="current-quantity-display"
          className={styles.quantity}
        >
          {quantity}
        </span>

        <button
          type="button"
          id="qty-increase-btn"
          disabled={quantity >= max}
          onClick={handleIncrement}
          className={styles.button}
          aria-label="Tăng số lượng"
        >
          <Plus className={styles.icon} />
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;

