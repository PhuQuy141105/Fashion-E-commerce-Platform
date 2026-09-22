import { useState, useEffect } from 'react';
import { X, MapPin, User, Phone, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './AddressFormModal.module.css';

const EMPTY_FORM = {
  recipient_name: '',
  recipient_phone: '',
  detail_address: '',
  ward: '',
  district: '',
  province: '',
  is_default: false,
};
export const AddressFormModal = ({ isOpen, mode = 'add', initialAddress, isFirstAddress = false, onClose, onSubmit }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setGeneralError(null);
    if (isEdit && initialAddress) {
      setForm({
        recipient_name: initialAddress.recipient_name || '',
        recipient_phone: initialAddress.recipient_phone || '',
        detail_address: initialAddress.detail_address || '',
        ward: initialAddress.ward || '',
        district: initialAddress.district || '',
        province: initialAddress.province || '',
        is_default: Boolean(initialAddress.is_default),
      });
    } else {
      setForm({ ...EMPTY_FORM, is_default: isFirstAddress });
    }
  }, [isOpen, isEdit, initialAddress, isFirstAddress]);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.recipient_name.trim()) errs.recipient_name = 'Vui lòng nhập tên người nhận';
    if (!form.recipient_phone.trim()) errs.recipient_phone = 'Vui lòng nhập số điện thoại';
    if (!form.detail_address.trim()) errs.detail_address = 'Vui lòng nhập địa chỉ chi tiết';
    if (!form.ward.trim()) errs.ward = 'Vui lòng nhập phường/xã';
    if (!form.district.trim()) errs.district = 'Vui lòng nhập quận/huyện';
    if (!form.province.trim()) errs.province = 'Vui lòng nhập tỉnh/thành phố';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setGeneralError(err.message || 'Không thể lưu địa chỉ. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const checked = form.is_default || isFirstAddress;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.backdrop}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.headerIcon}>
                  <MapPin />
                </div>
                <div>
                  <h3 className={styles.headerTitle}>{isEdit ? 'Sửa địa chỉ giao hàng' : 'Thêm địa chỉ mới'}</h3>
                  <p className={styles.headerSubtitle}>
                    {isEdit
                      ? 'Cập nhật thông tin người nhận và địa điểm giao hàng.'
                      : 'Nhập thông tin người nhận để giao hàng chính xác.'}
                  </p>
                </div>
              </div>

              <button type="button" id="close-address-modal-btn" onClick={onClose} className={styles.closeButton}>
                <X />
              </button>
            </div>

            {generalError && (
              <div className={styles.errorBanner}>
                <AlertCircle className={styles.errorBannerIcon} />
                <div>
                  <p className={styles.errorBannerTitle}>Có lỗi xảy ra</p>
                  <p className={styles.errorBannerText}>{generalError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row2}>
                <div>
                  <label htmlFor="af-recipient-name" className={styles.label}>
                    Tên người nhận <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} />
                    <input
                      id="af-recipient-name"
                      type="text"
                      placeholder="VD: Nguyễn Văn A"
                      value={form.recipient_name}
                      onChange={handleChange('recipient_name')}
                      maxLength={100}
                      className={`${styles.input} ${styles.inputWithIcon} ${errors.recipient_name ? styles.inputError : ''}`}
                    />
                  </div>
                  {errors.recipient_name && <p className={styles.fieldError}>{errors.recipient_name}</p>}
                </div>

                <div>
                  <label htmlFor="af-recipient-phone" className={styles.label}>
                    Số điện thoại <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <Phone className={styles.inputIcon} />
                    <input
                      id="af-recipient-phone"
                      type="tel"
                      placeholder="VD: 0912345678"
                      value={form.recipient_phone}
                      onChange={handleChange('recipient_phone')}
                      maxLength={10}
                      className={`${styles.input} ${styles.inputWithIcon} ${errors.recipient_phone ? styles.inputError : ''}`}
                    />
                  </div>
                  {errors.recipient_phone && <p className={styles.fieldError}>{errors.recipient_phone}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="af-detail-address" className={styles.label}>
                  Địa chỉ chi tiết (số nhà, tên đường) <span className={styles.required}>*</span>
                </label>
                <input
                  id="af-detail-address"
                  type="text"
                  placeholder="VD: 123 Nguyễn Huệ"
                  value={form.detail_address}
                  onChange={handleChange('detail_address')}
                  maxLength={255}
                  className={`${styles.input} ${errors.detail_address ? styles.inputError : ''}`}
                />
                {errors.detail_address && <p className={styles.fieldError}>{errors.detail_address}</p>}
              </div>

              <div className={styles.row3}>
                <div>
                  <label htmlFor="af-ward" className={styles.label}>
                    Phường/Xã <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="af-ward"
                    type="text"
                    placeholder="VD: Phường Bến Nghé"
                    value={form.ward}
                    onChange={handleChange('ward')}
                    maxLength={100}
                    className={`${styles.input} ${errors.ward ? styles.inputError : ''}`}
                  />
                  {errors.ward && <p className={styles.fieldError}>{errors.ward}</p>}
                </div>

                <div>
                  <label htmlFor="af-district" className={styles.label}>
                    Quận/Huyện <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="af-district"
                    type="text"
                    placeholder="VD: Quận 1"
                    value={form.district}
                    onChange={handleChange('district')}
                    maxLength={100}
                    className={`${styles.input} ${errors.district ? styles.inputError : ''}`}
                  />
                  {errors.district && <p className={styles.fieldError}>{errors.district}</p>}
                </div>

                <div>
                  <label htmlFor="af-province" className={styles.label}>
                    Tỉnh/Thành phố <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="af-province"
                    type="text"
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={form.province}
                    onChange={handleChange('province')}
                    maxLength={100}
                    className={`${styles.input} ${errors.province ? styles.inputError : ''}`}
                  />
                  {errors.province && <p className={styles.fieldError}>{errors.province}</p>}
                </div>
              </div>
              <div className={styles.checkboxSection}>
                <label className={styles.checkboxLabel}>
                  <div className={styles.checkboxVisualWrapper}>
                    <input
                      id="af-is-default"
                      type="checkbox"
                      checked={checked}
                      disabled={isFirstAddress}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                      className={styles.checkboxInput}
                    />
                    <div className={`${styles.checkboxVisual} ${checked ? styles.checkboxVisualChecked : ''}`}>
                      {checked && <Check className={styles.checkboxCheckIcon} />}
                    </div>
                  </div>
                  <div>
                    <span className={styles.checkboxTitle}>Đặt làm địa chỉ giao hàng mặc định</span>
                    <span className={styles.checkboxHint}>
                      {isFirstAddress
                        ? 'Địa chỉ đầu tiên của bạn sẽ tự động là địa chỉ mặc định.'
                        : 'Địa chỉ này sẽ được tự động chọn khi thanh toán.'}
                    </span>
                  </div>
                </label>
              </div>
              <div className={styles.footer}>
                <button type="button" onClick={onClose} disabled={submitting} className={styles.cancelButton}>
                  Huỷ
                </button>
                <button type="submit" disabled={submitting} className={styles.saveButton}>
                  {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddressFormModal;