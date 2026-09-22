import { useState, useEffect } from 'react';
import { X, Ticket, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import styles from './VoucherFormModal.module.css';

function formatDateForInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  code: '',
  description: '',
  discount_type: 'PERCENT',
  discount_value: '',
  min_order_value: 0,
  max_discount_amount: '',
  usage_limit: 100,
  start_date: '',
  end_date: '',
};

export const VoucherFormModal = ({ isOpen, voucherToEdit, onClose, onSubmit }) => {
  const isEditing = Boolean(voucherToEdit);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setGeneralError(null);
    if (voucherToEdit) {
      setForm({
        code: voucherToEdit.code,
        description: voucherToEdit.description || '',
        discount_type: voucherToEdit.discount_type,
        discount_value: voucherToEdit.discount_value,
        min_order_value: voucherToEdit.min_order_value,
        max_discount_amount: voucherToEdit.max_discount_amount ?? '',
        usage_limit: voucherToEdit.usage_limit,
        start_date: formatDateForInput(voucherToEdit.start_date),
        end_date: formatDateForInput(voucherToEdit.end_date),
      });
    } else {
      const today = new Date();
      const future = new Date();
      future.setDate(today.getDate() + 30);
      setForm({ ...EMPTY_FORM, start_date: formatDateForInput(today), end_date: formatDateForInput(future) });
    }
  }, [isOpen, voucherToEdit]);

  if (!isOpen) return null;

  const handleGenerateCode = () => {
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm((p) => ({ ...p, code: `ATELIER${suffix}` }));
    setErrors((prev) => ({ ...prev, code: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.code.trim()) errs.code = 'Vui lòng nhập mã voucher';
    if (!form.discount_value || Number(form.discount_value) <= 0) errs.discount_value = 'Giá trị giảm giá phải lớn hơn 0';
    if (form.discount_type === 'PERCENT' && Number(form.discount_value) > 100) errs.discount_value = 'Giảm theo % không được vượt quá 100';
    if (!form.usage_limit || Number(form.usage_limit) <= 0) errs.usage_limit = 'Giới hạn lượt dùng phải từ 1 trở lên';
    if (!form.start_date) errs.start_date = 'Vui lòng chọn ngày bắt đầu';
    if (!form.end_date) errs.end_date = 'Vui lòng chọn ngày kết thúc';
    if (form.start_date && form.end_date && form.end_date <= form.start_date) errs.end_date = 'Ngày kết thúc phải sau ngày bắt đầu';
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
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_value: Number(form.min_order_value) || 0,
        max_discount_amount: form.max_discount_amount === '' ? null : Number(form.max_discount_amount),
        usage_limit: Number(form.usage_limit),
        start_date: form.start_date,
        end_date: form.end_date,
      });
    } catch (err) {
      setGeneralError(err.message || 'Không thể lưu voucher. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Ticket />
            </div>
            <div>
              <h3 className={styles.title}>{isEditing ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
              <p className={styles.subtitle}>{isEditing ? 'Cập nhật thông tin mã giảm giá' : 'Thiết lập mã giảm giá mới'}</p>
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
          <div>
            <label className={styles.label}>
              Mã voucher <span className={styles.required}>*</span>
            </label>
            <div className={styles.codeRow}>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="VD: SUMMER2026"
                className={styles.input}
              />
              <button type="button" onClick={handleGenerateCode} className={styles.generateButton} title="Tạo mã ngẫu nhiên">
                <Sparkles className={styles.generateIcon} />
              </button>
            </div>
            {errors.code && <p className={styles.fieldError}>{errors.code}</p>}
          </div>

          <div>
            <label className={styles.label}>Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="VD: Giảm giá dịp hè"
              className={styles.input}
            />
          </div>

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>Loại giảm giá</label>
              <select value={form.discount_type} onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))} className={styles.select}>
                <option value="PERCENT">Giảm theo %</option>
                <option value="FIXED">Giảm cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className={styles.label}>
                Giá trị giảm <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.discount_value}
                onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'PERCENT' ? 'VD: 15' : 'VD: 50000'}
                className={styles.input}
              />
              {errors.discount_value && <p className={styles.fieldError}>{errors.discount_value}</p>}
            </div>
          </div>

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>Đơn tối thiểu (VNĐ)</label>
              <input
                type="number"
                min="0"
                value={form.min_order_value}
                onChange={(e) => setForm((p) => ({ ...p, min_order_value: e.target.value }))}
                className={styles.input}
              />
            </div>

            {form.discount_type === 'PERCENT' && (
              <div>
                <label className={styles.label}>Giảm tối đa (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={form.max_discount_amount}
                  onChange={(e) => setForm((p) => ({ ...p, max_discount_amount: e.target.value }))}
                  placeholder="Không giới hạn"
                  className={styles.input}
                />
              </div>
            )}
          </div>

          <div>
            <label className={styles.label}>
              Giới hạn tổng lượt dùng <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.usage_limit}
              onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
              className={styles.input}
            />
            {errors.usage_limit && <p className={styles.fieldError}>{errors.usage_limit}</p>}
            {isEditing && <p className={styles.hint}>Đã dùng: {voucherToEdit.used_count} lượt</p>}
          </div>

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>
                Ngày bắt đầu <span className={styles.required}>*</span>
              </label>
              <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} className={styles.input} />
              {errors.start_date && <p className={styles.fieldError}>{errors.start_date}</p>}
            </div>

            <div>
              <label className={styles.label}>
                Ngày kết thúc <span className={styles.required}>*</span>
              </label>
              <input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} className={styles.input} />
              {errors.end_date && <p className={styles.fieldError}>{errors.end_date}</p>}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
              {isSubmitting && <Loader2 className={styles.spinnerIcon} />}
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo voucher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoucherFormModal;