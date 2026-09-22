import { Layers, Edit3, Archive, ImageOff } from 'lucide-react';
import ProductStatusBadge, { StockStatusBadge } from '../ProductStatusBadge/ProductStatusBadge';
import styles from './ProductRow.module.css';

export const ProductRow = ({ product, onViewVariants, onEdit, onArchive }) => {
  return (
    <tr className={styles.row}>
      <td className={styles.cellImage}>
        <div className={styles.imageWrapper}>
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.name} referrerPolicy="no-referrer" className={styles.image} />
          ) : (
            <ImageOff className={styles.imagePlaceholder} />
          )}
        </div>
      </td>

      <td className={styles.cellName}>
        <button type="button" onClick={() => onEdit(product)} className={styles.nameButton} title={product.name}>
          {product.name}
        </button>
        <p className={styles.variantSub}>
          {product.variant_count ?? 0} biến thể
        </p>
      </td>

      <td className={styles.cellText}>{product.brand?.name || '—'}</td>

      <td className={styles.cellCategory}>
        <span className={styles.categoryTag}>{product.category?.name}</span>
      </td>

      <td className={styles.cellPrice}>{Number(product.base_price).toLocaleString('vi-VN')} VNĐ</td>

      <td className={styles.cellStock}>
        <StockStatusBadge totalStock={product.total_stock ?? 0} />
      </td>

      <td className={styles.cellStatus}>
        <ProductStatusBadge status={product.status} />
      </td>

      <td className={styles.cellActions}>
        <div className={styles.actionsRow}>
          <button
            type="button"
            onClick={() => onViewVariants(product)}
            className={styles.actionButton}
            title={`Quản lý biến thể (${product.variant_count ?? 0})`}
          >
            <Layers className={styles.actionIcon} />
          </button>

          <button type="button" onClick={() => onEdit(product)} className={styles.actionButton} title="Sửa thông tin sản phẩm">
            <Edit3 className={styles.actionIcon} />
          </button>

          {product.status !== 'DISCONTINUED' && (
            <button
              type="button"
              onClick={() => onArchive(product)}
              className={`${styles.actionButton} ${styles.actionButtonWarning}`}
              title="Ngừng bán sản phẩm"
            >
              <Archive className={styles.actionIcon} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ProductRow;