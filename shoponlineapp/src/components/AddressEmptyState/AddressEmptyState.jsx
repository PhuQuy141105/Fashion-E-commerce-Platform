import { MapPin, Plus } from 'lucide-react';
import styles from './AddressEmptyState.module.css';

export const AddressEmptyState = ({ onAddNew }) => {
  return (
    <div id="address-empty-state" className={styles.wrapper}>
      <div className={styles.iconBox}>
        <MapPin className={styles.icon} strokeWidth={1.75} />
      </div>

      <h3 className={styles.title}>Chưa có địa chỉ giao hàng nào</h3>
      <p className={styles.desc}>
        Bạn chưa lưu địa điểm giao hàng nào. Thêm địa chỉ nhà riêng hoặc văn phòng để thanh toán
        nhanh hơn trong các lần mua sau.
      </p>

      <button type="button" id="empty-state-add-btn" onClick={onAddNew} className={styles.addButton}>
        <Plus className={styles.addIcon} />
        <span>Thêm địa chỉ đầu tiên</span>
      </button>
    </div>
  );
};

export default AddressEmptyState;