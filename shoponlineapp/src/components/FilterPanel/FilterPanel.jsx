import { useEffect, useState } from 'react'
import {Filter,RotateCcw,ChevronDown} from 'lucide-react'
import { FilterChip } from '../FilterChip/FilterChip'
import styles from './FilterPanel.module.css'
import { SORT_OPTIONS, SIZES } from '../../services/ProductService'

export const FilterPanel = ({
  filters,
  onFilterChange,
  onClearAll,
  totalResults,
  categories = [],
  brands = [],
  colorSuggestions = []
}) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApply = () => {
    onFilterChange(localFilters)
  }

  const handleReset = () => {
    onClearAll()
  }

  const handleRemoveActive = (key, defaultValue) => {
    const updated = {
      ...filters,
      [key]: defaultValue
    }

    setLocalFilters(updated)
    onFilterChange(updated)
  }

  const categoryName = (id) => {
    return (
      categories.find(
        (c) => String(c.id) === String(id)
      )?.name || id
    )
  }

  const brandName = (id) => {
    return (
      brands.find(
        (b) => String(b.id) === String(id)
      )?.name || id
    )
  }

  const activeFilterList = []

  if (filters.category && filters.category !== 'All') {
    activeFilterList.push({
      label: `Danh mục: ${categoryName(filters.category)}`,
      key: 'category',
      defaultValue: 'All'
    })
  }

  if (filters.brand && filters.brand !== 'All') {
    activeFilterList.push({
      label: `Thương hiệu: ${brandName(filters.brand)}`,
      key: 'brand',
      defaultValue: 'All'
    })
  }

  if (filters.size && filters.size !== 'All') {
    activeFilterList.push({
      label: `Size: ${filters.size}`,
      key: 'size',
      defaultValue: 'All'
    })
  }

  if (filters.color?.trim()) {
    activeFilterList.push({
      label: `Màu: ${filters.color}`,
      key: 'color',
      defaultValue: ''
    })
  }

  if (
    filters.maxPrice < 1000000 ||
    filters.minPrice > 0
  ) {
    activeFilterList.push({
      label: `$${filters.minPrice} - $${filters.maxPrice}`,
      key: 'maxPrice',
      defaultValue: 1000000
    })
  }

  return (
    <div
      id="product-filter-panel"
      className={styles.filterPanel}
    >
      {/* Header */}
      <div className={styles.filterHeader}>
        <div className={styles.filterHeaderLeft}>
          <div className={styles.filterIcon}>
            <Filter />
          </div>

          <div>
            <h2>Tìm kiếm & Lọc</h2>
            <p>{totalResults} sản phẩm phù hợp</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {activeFilterList.length > 0 && (
            <button
              type="button"
              id="filter-clear-all-btn"
              onClick={handleReset}
              className={styles.clearAllButton}
            >
              <RotateCcw />
              <span>Xoá tất cả</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setIsExpanded(!isExpanded)
            }
            className={styles.mobileToggle}
            aria-label="Ẩn/hiện bộ lọc"
          >
            <ChevronDown
              className={
                isExpanded
                  ? styles.rotate
                  : ''
              }
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={styles.filterContent}>

          {/* Category / Brand / Sort */}
          <div className={styles.topFilters}>

            {/* Category */}
            <div className={styles.formGroup}>
              <label htmlFor="filter-category-select">
                Danh mục
              </label>

              <div className={styles.selectWrapper}>
                <select
                  id="filter-category-select"
                  value={localFilters.category}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      category: e.target.value
                    }))
                  }
                >
                  <option value="All">
                    Tất cả danh mục
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <ChevronDown />
              </div>
            </div>

            {/* Brand */}
            <div className={styles.formGroup}>
              <label htmlFor="filter-brand-select">
                Thương hiệu
              </label>

              <div className={styles.selectWrapper}>
                <select
                  id="filter-brand-select"
                  value={localFilters.brand}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      brand: e.target.value
                    }))
                  }
                >
                  <option value="All">
                    Tất cả thương hiệu
                  </option>

                  {brands.map((brand) => (
                    <option
                      key={brand.id}
                      value={brand.id}
                    >
                      {brand.name}
                    </option>
                  ))}
                </select>

                <ChevronDown />
              </div>
            </div>

            {/* Sort */}
            <div className={styles.formGroup}>
              <label htmlFor="filter-sort-select">
                Sắp xếp
              </label>

              <div className={styles.selectWrapper}>
                <select
                  id="filter-sort-select"
                  value={localFilters.sort}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      sort: e.target.value
                    }))
                  }
                >
                  {SORT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>

                <ChevronDown />
              </div>
            </div>
          </div>

          {/* Size / Color */}
          <div className={styles.sizeColorSection}>

            {/* Size */}
            <div className={styles.sizeSection}>
              <label>Size</label>

              <div className={styles.sizeList}>
                {SIZES.map((size) => {
                  const isSelected =
                    localFilters.size === size

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          size
                        }))
                      }
                      className={`${styles.sizeButton} ${
                        isSelected
                          ? styles.sizeSelected
                          : ''
                      }`}
                    >
                      {size === 'All'
                        ? 'Tất cả'
                        : size}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color */}
            <div className={styles.colorSection}>
              <label htmlFor="filter-color-input">
                Màu sắc
              </label>

              <div className={styles.inputWrapper}>
                <input
                  id="filter-color-input"
                  type="text"
                  list="color-suggestions-list"
                  value={localFilters.color}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      color: e.target.value
                    }))
                  }
                  placeholder="VD: đen, be, xanh navy..."
                />

                <datalist id="color-suggestions-list">
                  {colorSuggestions.map((color) => (
                    <option
                      key={color}
                      value={color}
                    />
                  ))}
                </datalist>

                {localFilters.color && (
                  <button
                    type="button"
                    onClick={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        color: ''
                      }))
                    }
                    className={styles.clearColorButton}
                  >
                    <X />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className={styles.priceSection}>
            <div className={styles.priceContent}>

              <div className={styles.priceInfo}>
                <label>Khoảng giá</label>

                <div className={styles.priceValue}>
                  <span>
                    {localFilters.minPrice.toLocaleString("vi-VN")}VNĐ
                  </span>

                  <span>−</span>

                  <span>
                    {localFilters.maxPrice.toLocaleString("vi-VN")}VNĐ
                  </span>
                </div>
              </div>

              <div className={styles.rangeWrapper}>
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="50000"
                  value={localFilters.maxPrice}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxPrice: Number(
                        e.target.value
                      )
                    }))
                  }
                />
              </div>

              <div className={styles.applyWrapper}>
                <button
                  type="button"
                  id="filter-apply-btn"
                  onClick={handleApply}
                  className={styles.applyButton}
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {activeFilterList.length > 0 && (
            <div className={styles.activeFilters}>
              <span className={styles.activeLabel}>
                Đang lọc:
              </span>

              {activeFilterList.map(
                (item, index) => (
                  <FilterChip
                    key={index}
                    label={item.label}
                    onRemove={() =>
                      handleRemoveActive(
                        item.key,
                        item.defaultValue
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterPanel