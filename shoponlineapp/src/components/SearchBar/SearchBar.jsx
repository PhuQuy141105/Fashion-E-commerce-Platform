import React from "react";
import { Search, X } from "lucide-react";
import styles from "./SearchBar.module.css";

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Tìm sản phẩm, thương hiệu hoặc danh mục...",
  className = "",
  autoFocus = false,
  onClear,
}) => {
  return (
    <div
      id="main-search-bar"
      className={`${styles.searchBar} ${className}`}
    >
      <div className={styles.searchIconWrapper}>
        <Search className={styles.searchIcon} />
      </div>

      <input
        type="text"
        id="home-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={styles.searchInput}
      />

      {value && (
        <button
          type="button"
          id="clear-search-btn"
          onClick={() => {
            onChange("");

            if (onClear) {
              onClear();
            }
          }}
          className={styles.clearButton}
          aria-label="Xoá tìm kiếm"
        >
          <X className={styles.clearIcon} />
        </button>
      )}
    </div>
  );
};