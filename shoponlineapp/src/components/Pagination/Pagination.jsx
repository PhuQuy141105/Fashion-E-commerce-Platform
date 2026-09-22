import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import styles from "./Pagination.module.css";

export const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [8, 12, 24],
  className = "",
}) => {
  if (totalItems <= 0) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);

  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis-start");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-end");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      id="catalog-pagination"
      aria-label="Phân trang sản phẩm"
      className={`${styles.pagination} ${className}`}
    >
      <div className={styles.desktopPagination}>
        <div className={styles.paginationInfo}>
          <div className={styles.infoText}>
            Hiển thị{" "}
            <span className={styles.infoStrong}>
              {startItem}–{endItem}
            </span>{" "}
            trong <span className={styles.infoStrong}>{totalItems}</span> sản
            phẩm
            <span className={styles.separator}>•</span>
            Trang <span className={styles.infoStrong}>{currentPage}</span>/
            <span className={styles.infoStrong}>{totalPages}</span>
          </div>

          {onItemsPerPageChange && (
            <div className={styles.itemsPerPage}>
              <span className={styles.itemsPerPageLabel}>Mỗi trang:</span>

              <div className={styles.itemsPerPageOptions}>
                {itemsPerPageOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onItemsPerPageChange(option)}
                    className={`${styles.itemsPerPageButton} ${
                      itemsPerPage === option ? styles.itemsPerPageActive : ""
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.pageControls}>
          {totalPages > 6 && (
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={styles.iconButton}
              aria-label="Trang đầu"
              title="Trang đầu"
            >
              <ChevronsLeft />
            </button>
          )}

          <button
            type="button"
            id="pagination-prev-btn"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={styles.navigationButton}
            aria-label="Trang trước"
          >
            <ChevronLeft />
            <span>Trước</span>
          </button>

          <div className={styles.pageNumbers}>
            {pageNumbers.map((page, index) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                  …
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  type="button"
                  id={`pagination-page-${page}`}
                  onClick={() => onPageChange(page)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={`${styles.pageButton} ${
                    page === currentPage ? styles.pageButtonActive : ""
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            id="pagination-next-btn"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={styles.navigationButton}
            aria-label="Trang sau"
          >
            <span>Sau</span>
            <ChevronRight />
          </button>

          {totalPages > 6 && (
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={styles.iconButton}
              aria-label="Trang cuối"
              title="Trang cuối"
            >
              <ChevronsRight />
            </button>
          )}
        </div>
      </div>

      <div className={styles.mobilePagination}>
        <div className={styles.mobileInfo}>
          <span>
            Hiển thị{" "}
            <strong>
              {startItem}–{endItem}
            </strong>{" "}
            / <strong>{totalItems}</strong>
          </span>

          <span className={styles.mobilePageInfo}>
            Trang {currentPage}/{totalPages}
          </span>
        </div>

        <div className={styles.mobileControls}>
          <button
            type="button"
            id="mobile-pagination-prev-btn"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={styles.mobileNavigationButton}
          >
            <ChevronLeft />
            <span>Trước</span>
          </button>

          <div className={styles.mobileCurrentPage}>
            <span>
              {currentPage} / {totalPages}
            </span>
          </div>

          <button
            type="button"
            id="mobile-pagination-next-btn"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={styles.mobileNavigationButton}
          >
            <span>Sau</span>
            <ChevronRight />
          </button>
        </div>
      </div>
    </nav>
  );
};
