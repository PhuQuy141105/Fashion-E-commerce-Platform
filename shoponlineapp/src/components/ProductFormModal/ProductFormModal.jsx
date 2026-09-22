import { useState, useEffect } from 'react';
import { X, Package, ImagePlus, AlertCircle } from 'lucide-react';
import styles from './ProductFormModal.module.css';

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const EMPTY_FORM = {
  category: '',
  brand: '',
  name: '',
  slug: '',
  description: '',
  gender_target: 'UNISEX',
  material: '',
  care_instruction: '',
  base_price: '',
  is_featured: false,
  status: 'ACTIVE',
};

export const ProductFormModal = ({ isOpen, mode = 'add', initialProduct, categories, brands, onClose, onSubmit }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setGeneralError(null);
    setThumbnailFile(null);
    setIsSlugManuallyEdited(false);

    if (isEdit && initialProduct) {
      setForm({
        category: initialProduct.category?.id ?? '',
        brand: initialProduct.brand?.id ?? '',
        name: initialProduct.name || '',
        slug: initialProduct.slug || '',
        description: initialProduct.description || '',
        gender_target: initialProduct.gender_target || 'UNISEX',
        material: initialProduct.material || '',
        care_instruction: initialProduct.care_instruction || '',
        base_price: initialProduct.base_price || '',
        is_featured: Boolean(initialProduct.is_featured),
        status: initialProduct.status || 'ACTIVE',
      });
      setThumbnailPreview(initialProduct.thumbnail || null);
    } else {
      setForm(EMPTY_FORM);
      setThumbnailPreview(null);
    }
  }, [isOpen, isEdit, initialProduct]);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: isSlugManuallyEdited ? prev.slug : slugify(name),
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.category) errs.category = 'Vui lòng chọn danh mục';
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
    if (!form.base_price || Number(form.base_price) <= 0) errs.base_price = 'Giá phải lớn hơn 0';
    if (!isEdit && !thumbnailFile) errs.thumbnail = 'Vui lòng chọn ảnh sản phẩm';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

      await onSubmit(formData);
    } catch (err) {
      setGeneralError(err.message || 'Không thể lưu sản phẩm. Vui lòng kiểm tra lại thông tin.');
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
              <Package />
            </div>
            <div>
              <h3 className={styles.title}>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
              <p className={styles.subtitle}>{isEdit ? 'Cập nhật thông tin sản phẩm' : 'Nhập thông tin sản phẩm để đăng bán'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeButton}>
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
          <div className={styles.thumbnailField}>
            <label className={styles.label}>
              Ảnh sản phẩm {!isEdit && <span className={styles.required}>*</span>}
            </label>
            <div className={styles.thumbnailRow}>
              <div className={styles.thumbnailPreview}>
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="preview" className={styles.thumbnailImage} />
                ) : (
                  <ImagePlus className={styles.thumbnailPlaceholderIcon} />
                )}
              </div>
              <label className={styles.uploadButton}>
                <span>{thumbnailPreview ? 'Đổi ảnh' : 'Chọn ảnh'}</span>
                <input type="file" accept="image/*" onChange={handleThumbnailChange} className={styles.hiddenFileInput} />
              </label>
            </div>
            {errors.thumbnail && <p className={styles.fieldError}>{errors.thumbnail}</p>}
          </div>

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>
                Danh mục <span className={styles.required}>*</span>
              </label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={styles.select}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className={styles.fieldError}>{errors.category}</p>}
            </div>

            <div>
              <label className={styles.label}>Thương hiệu</label>
              <select value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} className={styles.select}>
                <option value="">-- Không có --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              Tên sản phẩm <span className={styles.required}>*</span>
            </label>
            <input type="text" value={form.name} onChange={handleNameChange} placeholder="VD: Áo thun cotton basic" className={styles.input} />
            {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
          </div>

          <div>
            <label className={styles.label}>Đường dẫn (slug)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setIsSlugManuallyEdited(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              placeholder="tu-dong-sinh-tu-ten"
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Mô tả chi tiết sản phẩm..."
              className={styles.textarea}
            />
          </div>

          <div className={styles.row3}>
            <div>
              <label className={styles.label}>
                Giá gốc (VNĐ) <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.base_price}
                onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))}
                placeholder="0"
                className={styles.input}
              />
              {errors.base_price && <p className={styles.fieldError}>{errors.base_price}</p>}
            </div>

            <div>
              <label className={styles.label}>Đối tượng</label>
              <select value={form.gender_target} onChange={(e) => setForm((p) => ({ ...p, gender_target: e.target.value }))} className={styles.select}>
                <option value="UNISEX">Unisex</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>

            {isEdit && (
              <div>
                <label className={styles.label}>Trạng thái</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={styles.select}>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                  <option value="DISCONTINUED">Ngừng bán</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.row2}>
            <div>
              <label className={styles.label}>Chất liệu</label>
              <input
                type="text"
                value={form.material}
                onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
                placeholder="VD: 100% cotton"
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.label}>Hướng dẫn bảo quản</label>
              <input
                type="text"
                value={form.care_instruction}
                onChange={(e) => setForm((p) => ({ ...p, care_instruction: e.target.value }))}
                placeholder="VD: Giặt máy nước lạnh"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelButton}>
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.saveButton}>
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;