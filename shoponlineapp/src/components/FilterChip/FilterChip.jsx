import { X } from 'lucide-react';
import styles from './FilterChip.module.css';

export const FilterChip = ({
  label,
  onRemove,
  onClick,
  active = false,
  colorSwatch,
  className = '',
}) => {
  const handleClick = onClick || onRemove;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        ${styles.filterChip}
        ${
          active
            ? styles.active
            : onRemove
            ? styles.removable
            : styles.default
        }
        ${className}
      `}
    >
      {colorSwatch && (
        <span
          className={styles.colorSwatch}
          style={{ backgroundColor: colorSwatch }}
        />
      )}

      <span>{label}</span>

      {onRemove && (
        <span className={styles.removeButton}>
          <X />
        </span>
      )}
    </button>
  );
};