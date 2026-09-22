import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import AddressCard from '../AddressCard/AddressCard';
import AddressFormModal from '../AddressFormModal/AddressFormModal';
import styles from './CheckoutAddressSection.module.css';
const DUPLICATE_ERROR_TEXT = 'Địa chỉ này đã tồn tại trong danh sách của bạn';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export const CheckoutAddressSection = ({
  addresses,
  isLoading,
  selectedAddressId,
  onSelectAddress,
  onRefreshAddresses,
  onDuplicate,
}) => {
  const [formModal, setFormModal] = useState({ isOpen: false, mode: 'add', address: null });

  const handleOpenAdd = () => setFormModal({ isOpen: true, mode: 'add', address: null });
  const handleOpenEdit = (address) => setFormModal({ isOpen: true, mode: 'edit', address });
  const handleClose = () => setFormModal((prev) => ({ ...prev, isOpen: false }));

  const handleSubmit = async (values) => {
    try {
      if (formModal.mode === 'edit') {
        const { data } = await authApis.patch(endpoints['user-address-detail'](formModal.address.id), values);
        await onRefreshAddresses();
        if (selectedAddressId === data.id) onSelectAddress(data);
      } else {
        const { data } = await authApis.post(endpoints['user-addresses'], values);
        await onRefreshAddresses();
        onSelectAddress(data);
      }
      handleClose();
    } catch (err) {
      const message = extractApiError(err, formModal.mode === 'edit' ? 'Cập nhật địa chỉ thất bại.' : 'Thêm địa chỉ thất bại.');
      if (message === DUPLICATE_ERROR_TEXT) {
        onDuplicate?.();
        return;
      }
      throw new Error(message);
    }
  };

  return (
    <section id="checkout-delivery-address-section" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.stepBadge}>1</div>
          <div>
            <h2 className={styles.title}>Địa chỉ giao hàng</h2>
            <p className={styles.subtitle}>Chọn nơi bạn muốn nhận đơn hàng này</p>
          </div>
        </div>

        <button type="button" id="checkout-add-new-address-btn" onClick={handleOpenAdd} className={styles.addButton}>
          <Plus className={styles.addIcon} />
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      ) : addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBox}>
            <MapPin className={styles.emptyIcon} />
          </div>
          <div>
            <p className={styles.emptyTitle}>Chưa có địa chỉ giao hàng nào</p>
            <p className={styles.emptyText}>Vui lòng thêm địa chỉ để tiếp tục đặt hàng</p>
          </div>
          <button type="button" onClick={handleOpenAdd} className={styles.emptyAddButton}>
            Thêm địa chỉ ngay
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selectable
              isSelected={selectedAddressId === address.id}
              onSelect={(addr) => onSelectAddress(addr)}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      <AddressFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialAddress={formModal.address}
        isFirstAddress={addresses.length === 0}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </section>
  );
};

export default CheckoutAddressSection;