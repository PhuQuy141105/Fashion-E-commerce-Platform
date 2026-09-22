import { useState, useEffect } from 'react';
import { X, Layers, Loader2, Save, Plus, AlertCircle } from 'lucide-react';
import styles from './VariantFormModal.module.css';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREESIZE'];

export const VariantFormModal = ({ isOpen, productName, basePrice, variantToEdit, onClose, onSubmit }) => {
  const isEdit = Boolean(variantToEdit);
  const [form, setForm] = useState({ color: '', size: 'M', stock_qty: 0, price_adjustment: 0 });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setGeneralError(null);
    if (variantToEdit) {
      setForm({
        color: variantToEdit.color,
        size: variantToEdit.size,
        stock_qty: variantToEdit.stock_qty,
        price_adjustment: variantToEdit.price_adjustment,
      });
    } else {
      setForm({ color: '', size: 'M', stock_qty: 0, price_adjustment: 0 });
    }
  }, [isOpen, variantToEdit]);

  if (!isOpen) return null;

  const finalPrice = Number(basePrice) + Number(form.price_adjustment || 0);

  const validate = () => {
    const errs = {};
    if (!form.color.trim()) errs.color = 'Vui lòng nhập màu sắc';
    if (form.stock_qty === '' || Number(form.stock_qty) < 0) errs.stock_qty = 'Tồn kho phải từ 0 trở lên';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        color: form.color.trim(),
        size: form.size,
        stock_qty: Number(form.stock_qty),
        price_adjustment: Number(form.price_adjustment || 0),
      });
    } catch (err) {
      setGeneralError(err.message || 'Không thể lưu biến thể. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="variant-modal-backdrop" className={styles.overlay}>
      <div id="variant-modal-container" className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Layers />
            </div>
            <div>
              <h3 className={styles.title}>{isEdit ? 'Sửa biến thể' : 'Thêm biến thể mới'}</h3>
              <p className={styles.subtitle}>
                {productName} ({Number(basePrice).toLocaleString('vi-VN')} VNĐ)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.closeButton}>
            <X />
          </button>
        </div>

        {generalError && (
          <div className={styles.errorBanner}>
            <AlertCircle className={styles.errorBannerIcon} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row2}>
            <div>
              <label className={styles.label}>
                Màu sắc <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="variant-color-input"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                placeholder="VD: Be, Đen, Trắng"
                disabled={isSubmitting}
                className={styles.input}
              />
              {errors.color && <p className={styles.fieldError}>{errors.color}</p>}
            </div>

            <div>
              <label className={styles.label}>
                Size <span className={styles.required}>*</span>
              </label>
              <select
                id="variant-size-select"
                value={form.size}
                onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
                disabled={isSubmitting}
                className={styles.select}
              >
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>
                Số lượng tồn kho <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="variant-stock-input"
                min="0"
                value={form.stock_qty}
                onChange={(e) => setForm((p) => ({ ...p, stock_qty: e.target.value }))}
                disabled={isSubmitting}
                className={styles.input}
              />
              {errors.stock_qty && <p className={styles.fieldError}>{errors.stock_qty}</p>}
            </div>

            <div>
              <label className={styles.label}>Điều chỉnh giá (VNĐ)</label>
              <input
                type="number"
                id="variant-price-adjustment-input"
                step="1000"
                value={form.price_adjustment}
                onChange={(e) => setForm((p) => ({ ...p, price_adjustment: e.target.value }))}
                placeholder="0"
                disabled={isSubmitting}
                className={styles.input}
              />
              <p className={styles.hint}>Cộng/trừ so với giá gốc. Có thể để số âm.</p>
            </div>
          </div>

          <div className={styles.finalPriceBox}>
            <span>Giá bán biến thể này</span>
            <strong>{finalPrice.toLocaleString('vi-VN')} VNĐ</strong>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
              {isSubmitting ? (
                <>
                  <Loader2 className={styles.spinnerIcon} />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  {isEdit ? <Save className={styles.saveIcon} /> : <Plus className={styles.saveIcon} />}
                  <span>{isEdit ? 'Lưu thay đổi' : 'Thêm biến thể'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantFormModal;