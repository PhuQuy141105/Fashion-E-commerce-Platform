import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, MessageSquare, Package, X, ChevronLeft, ChevronRight } from "lucide-react";
import { authApis, endpoints } from "../../configs/Apis";
import { fetchAdminProducts } from "../../services/ProductService";
import StaffLayout from "../../components/StaffLayout/StaffLayout";
import ReviewStatisticsCards from "../../components/ReviewStatisticsCards/ReviewStatisticsCards";
import ReviewFilterToolbar from "../../components/ReviewFilterToolbar/ReviewFilterToolbar";
import AdminReviewCard from "../../components/AdminReviewCard/AdminReviewCard";
import BulkModerationBar from "../../components/BulkModerationBar/BulkModerationBar";
import HideReviewModal from "../../components/HideReviewModal/HideReviewModal";
import styles from "./AdminReviews.module.css";

const DEFAULT_FILTERS = { search: "", rating: "ALL", ordering: "newest" };

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export default function AdminReviews() {
  const [currentUser, setCurrentUser] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [productHasNextPage, setProductHasNextPage] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewFilters, setReviewFilters] = useState(DEFAULT_FILTERS);
  const [visibilityTab, setVisibilityTab] = useState("ALL");

  const [selectedReviewIds, setSelectedReviewIds] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: "HIDE",
    review: null,
    bulkIds: null,
  });
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    authApis
      .get(endpoints["current-user"])
      .then((res) => setCurrentUser(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {

    const timer = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const result = await fetchAdminProducts({ search: productSearch }, productPage);
        setProductResults(result.items);
        setProductHasNextPage(result.hasNextPage);
      } catch (err) {
        console.error("Tìm sản phẩm thất bại:", err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [productSearch, productPage]);


  const handleSearchChange = (value) => {
    setProductSearch(value);
    setProductPage(1);
  };

  const loadReviews = useCallback(async () => {
    if (!selectedProduct) return;
    setIsLoadingReviews(true);
    try {
      const params = {};
      if (reviewFilters.search.trim())
        params.search = reviewFilters.search.trim();
      if (reviewFilters.rating !== "ALL") params.rating = reviewFilters.rating;
      if (reviewFilters.ordering) params.ordering = reviewFilters.ordering;
      const { data } = await authApis.get(
        endpoints["product-reviews"](selectedProduct.id),
        { params },
      );
      setReviews(data.results ?? data);
      setSelectedReviewIds([]);
    } catch (err) {
      console.error("Không tải được đánh giá:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [selectedProduct, reviewFilters]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setProductSearch("");
    setProductResults([]);
    setProductPage(1);
    setReviewFilters(DEFAULT_FILTERS);
    setVisibilityTab("ALL");
  };

  const handleDeselectProduct = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setProductResults([]);
    setProductPage(1);
    setReviews([]);
  };

  const visibleReviews = useMemo(() => {
    if (visibilityTab === "VISIBLE") return reviews.filter((r) => !r.is_hidden);
    if (visibilityTab === "HIDDEN") return reviews.filter((r) => r.is_hidden);
    return reviews;
  }, [reviews, visibilityTab]);

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleToggleSelect = (id) => {
    setSelectedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (selectAll) => {
    setSelectedReviewIds(selectAll ? visibleReviews.map((r) => r.id) : []);
  };

  const patchReviewsHidden = async (ids, isHidden) => {
    await Promise.all(
      ids.map((id) =>
        authApis.patch(endpoints["review-detail"](id), { is_hidden: isHidden }),
      ),
    );
    setReviews((prev) =>
      prev.map((r) => (ids.includes(r.id) ? { ...r, is_hidden: isHidden } : r)),
    );
  };

  const handleConfirmModeration = async () => {
    const ids =
      modalState.bulkIds || (modalState.review ? [modalState.review.id] : []);
    try {
      await patchReviewsHidden(ids, modalState.action === "HIDE");
      showBanner(
        "success",
        modalState.action === "HIDE"
          ? `Đã ẩn ${ids.length} đánh giá.`
          : `Đã hiện lại ${ids.length} đánh giá.`,
      );
      setModalState({
        isOpen: false,
        action: "HIDE",
        review: null,
        bulkIds: null,
      });
      setSelectedReviewIds([]);
    } catch (err) {
      throw new Error(
        extractApiError(err, "Thao tác thất bại. Vui lòng thử lại."),
      );
    }
  };

  return (
    <StaffLayout activePage="reviews" currentUser={currentUser}>
      <main id="admin-reviews-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Đánh giá sản phẩm</h1>
            <p className={styles.subtitle}>
              Kiểm soát nội dung đánh giá công khai theo từng sản phẩm.
            </p>
          </div>
        </div>

        {banner && (
          <div
            className={`${styles.banner} ${banner.type === "success" ? styles.bannerSuccess : styles.bannerError}`}
          >
            {banner.message}
          </div>
        )}

        <div className={styles.productPicker}>
          <div className={styles.pickerSearchWrapper}>
            <Search className={styles.pickerSearchIcon} />
            <input
              type="text"
              id="admin-review-product-search"
              value={productSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm sản phẩm để xem đánh giá..."
              className={styles.pickerSearchInput}
            />
            {productSearch && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className={styles.pickerClearButton}
              >
                <X className={styles.pickerClearIcon} />
              </button>
            )}
          </div>

          {productResults.length > 0 && (
            <div className={styles.pickerResults}>
              {productResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={styles.pickerResultItem}
                >
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className={styles.pickerResultImage}
                    />
                  ) : (
                    <div className={styles.pickerResultImagePlaceholder}>
                      <Package
                        className={styles.pickerResultImagePlaceholderIcon}
                      />
                    </div>
                  )}
                  <span className={styles.pickerResultName}>{p.name}</span>
                </button>
              ))}

              <div className={styles.pickerPagination}>
                <span className={styles.pickerPaginationInfo}>Trang {productPage}</span>
                <div className={styles.pickerPaginationControls}>
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    disabled={productPage <= 1 || isSearchingProducts}
                    className={styles.pickerPageButton}
                  >
                    <ChevronLeft className={styles.pickerPageIcon} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => p + 1)}
                    disabled={!productHasNextPage || isSearchingProducts}
                    className={styles.pickerPageButton}
                  >
                    <ChevronRight className={styles.pickerPageIcon} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedProduct && (
            <div className={styles.selectedProductBar}>
              {selectedProduct.thumbnail ? (
                <img
                  src={selectedProduct.thumbnail}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className={styles.selectedProductImage}
                />
              ) : (
                <div className={styles.pickerResultImagePlaceholder}>
                  <Package
                    className={styles.pickerResultImagePlaceholderIcon}
                  />
                </div>
              )}
              <span className={styles.selectedProductName}>
                {selectedProduct.name}
              </span>
              <button
                type="button"
                onClick={handleDeselectProduct}
                className={styles.selectedProductClear}
              >
                <X className={styles.pickerClearIcon} />
              </button>
            </div>
          )}
        </div>

        {!selectedProduct ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <MessageSquare className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>Chọn 1 sản phẩm để bắt đầu</h3>
            <p className={styles.emptyText}>
              Tìm và chọn sản phẩm ở ô phía trên để xem và kiểm duyệt đánh giá.
            </p>
          </div>
        ) : (
          <>
            <ReviewStatisticsCards
              reviews={reviews}
              selectedVisibility={visibilityTab}
              onSelectVisibility={setVisibilityTab}
              isLoading={isLoadingReviews}
            />

            <ReviewFilterToolbar
              filters={reviewFilters}
              onApplyFilters={(p) =>
                setReviewFilters((prev) => ({ ...prev, ...p }))
              }
              onResetFilters={() => setReviewFilters(DEFAULT_FILTERS)}
              totalResults={visibleReviews.length}
              isLoading={isLoadingReviews}
            />

            <BulkModerationBar
              selectedCount={selectedReviewIds.length}
              totalCount={visibleReviews.length}
              onSelectAll={handleSelectAll}
              onBulkHide={() =>
                setModalState({
                  isOpen: true,
                  action: "HIDE",
                  review: null,
                  bulkIds: selectedReviewIds,
                })
              }
              onBulkShow={() =>
                setModalState({
                  isOpen: true,
                  action: "SHOW",
                  review: null,
                  bulkIds: selectedReviewIds,
                })
              }
              onClearSelection={() => setSelectedReviewIds([])}
            />

            {isLoadingReviews ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : visibleReviews.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconBox}>
                  <MessageSquare className={styles.emptyIcon} />
                </div>
                <h3 className={styles.emptyTitle}>Không có đánh giá nào</h3>
                <p className={styles.emptyText}>
                  Sản phẩm này chưa có đánh giá nào khớp bộ lọc hiện tại.
                </p>
              </div>
            ) : (
              <div className={styles.reviewsList}>
                {visibleReviews.map((review) => (
                  <AdminReviewCard
                    key={review.id}
                    review={review}
                    isSelected={selectedReviewIds.includes(review.id)}
                    onToggleSelect={handleToggleSelect}
                    onRequestHide={(r) =>
                      setModalState({
                        isOpen: true,
                        action: "HIDE",
                        review: r,
                        bulkIds: null,
                      })
                    }
                    onRequestShow={(r) =>
                      setModalState({
                        isOpen: true,
                        action: "SHOW",
                        review: r,
                        bulkIds: null,
                      })
                    }
                    onPreviewImage={() => {}}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <HideReviewModal
        isOpen={modalState.isOpen}
        targetAction={modalState.action}
        review={modalState.review}
        bulkCount={modalState.bulkIds?.length}
        onClose={() =>
          setModalState({
            isOpen: false,
            action: "HIDE",
            review: null,
            bulkIds: null,
          })
        }
        onConfirm={handleConfirmModeration}
      />
    </StaffLayout>
  );
}