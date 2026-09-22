import { useState, useEffect, useRef, useMemo } from "react";
import { Star, CheckCircle2, PenLine, ImageOff } from "lucide-react";
import { endpoints, authApis } from "../../configs/Apis";
import ReviewCard from "../ReviewCard/ReviewCard";
import ReviewForm from "../ReviewForm/ReviewForm";
import styles from "./ProductTabs.module.css";

const GENDER_LABEL = { MALE: "Nam", FEMALE: "Nữ", UNISEX: "Unisex" };
const STATUS_LABEL = {
  ACTIVE: "Còn hàng",
  OUT_OF_STOCK: "Hết hàng",
  DISCONTINUED: "Ngừng kinh doanh",
};
const STAR_BUCKETS = [5, 4, 3, 2, 1];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "rating_desc", label: "Đánh giá cao nhất" },
  { value: "rating_asc", label: "Đánh giá thấp nhất" },
];

export const ProductTabs = ({ productId, product }) => {
  const [activeTab, setActiveTab] = useState("description");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [nextReviewsUrl, setNextReviewsUrl] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null); 
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState(""); 
  const [sortOrder, setSortOrder] = useState("newest");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const debounceRef = useRef(null);

  const breakdown = product?.rating_breakdown || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  const totalReviews = product?.review_count ?? 0;
  const avgRating = Number(product?.avg_rating ?? 0);
  const recommendCount =
    (breakdown[4] ?? breakdown["4"] ?? 0) +
    (breakdown[5] ?? breakdown["5"] ?? 0);

  const handleToggleReviewForm = () => setShowReviewForm((prev) => !prev);

  const handleReviewSubmitted = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setReviewsCount((prev) => prev + 1);
    setShowReviewForm(false);
  };

  const loadReviews = async (url, { rating, search, ordering } = {}) => {
    setIsLoadingReviews(true);
    setReviewsError(null);

    try {
      const res = url
        ? await authApis.get(url)
        : await authApis.get(endpoints["product-reviews"](productId), {
            params: {
              ...(rating ? { rating } : {}),
              ...(search ? { search } : {}),
              ordering,
            },
          });

      const data = res.data;
      const list = data.results ?? data;

      setReviews((prev) => (url ? [...prev, ...list] : list));
      setReviewsCount(data.count ?? list.length);
      setNextReviewsUrl(data.next || null);
    } catch (err) {
      console.error("Không tải được đánh giá:", err);
      setReviewsError("Không tải được đánh giá. Vui lòng thử lại.");
    } finally {
      setIsLoadingReviews(false);
      setReviewsLoaded(true);
    }
  };

  const handleOpenReviewsTab = () => {
    setActiveTab("reviews");
    if (!reviewsLoaded) {
      loadReviews(null, {
        rating: ratingFilter,
        search: searchKeyword,
        ordering: sortOrder,
      });
    }
  };

  useEffect(() => {
    if (!reviewsLoaded) return;
    loadReviews(null, {
      rating: ratingFilter,
      search: searchKeyword,
      ordering: sortOrder,
    });
  }, [ratingFilter, searchKeyword, sortOrder]);

  const handleSearchInputChange = (value) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchKeyword(value.trim()), 400);
  };

  const handleToggleRatingFilter = (star) => {
    const bucket = Math.floor(star);
    setRatingFilter((prev) => (prev === bucket ? null : bucket));
  };

  const handleClearFilters = () => {
    setRatingFilter(null);
    setSearchInput("");
    setSearchKeyword("");
  };

  return (
    <div id="product-details-tabs-section" className={styles.container}>
      <div className={styles.tabsNavigation}>
        <button
          type="button"
          onClick={() => setActiveTab("description")}
          className={`${styles.tabButton} ${activeTab === "description" ? styles.activeTab : styles.inactiveTab}`}
        >
          Mô tả
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("specifications")}
          className={`${styles.tabButton} ${activeTab === "specifications" ? styles.activeTab : styles.inactiveTab}`}
        >
          Thông số
        </button>

        <button
          type="button"
          onClick={handleOpenReviewsTab}
          className={`${styles.tabButton} ${activeTab === "reviews" ? styles.activeTab : styles.inactiveTab}`}
        >
          <span>Đánh giá</span>
          <span
            className={`${styles.reviewCount} ${activeTab === "reviews" ? styles.reviewCountActive : styles.reviewCountInactive}`}
          >
            {totalReviews}
          </span>
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "description" && (
          <div className={styles.description}>
            {product?.description ? (
              <div
                className={styles.descriptionText}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className={styles.emptyText}>
                Sản phẩm chưa có mô tả chi tiết.
              </p>
            )}

            {(product?.material || product?.care_instruction) && (
              <div className={styles.infoGrid}>
                {product?.material && (
                  <div className={styles.infoCard}>
                    <h4 className={styles.infoTitle}>Chất liệu</h4>
                    <p className={styles.infoText}>{product.material}</p>
                  </div>
                )}

                {product?.care_instruction && (
                  <div className={styles.infoCard}>
                    <h4 className={styles.infoTitle}>Hướng dẫn bảo quản</h4>
                    <p className={styles.infoText}>
                      {product.care_instruction}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "specifications" && (
          <div className={styles.specifications}>
            <div className={styles.specificationList}>
              <div className={styles.specificationRowAlt}>
                <span className={styles.specificationLabel}>Thương hiệu</span>
                <span className={styles.specificationValue}>
                  {product?.brand?.name || "—"}
                </span>
              </div>

              <div className={styles.specificationRow}>
                <span className={styles.specificationLabel}>Danh mục</span>
                <span className={styles.specificationValue}>
                  {product?.category?.name || "—"}
                </span>
              </div>

              <div className={styles.specificationRowAlt}>
                <span className={styles.specificationLabel}>Chất liệu</span>
                <span className={styles.specificationValue}>
                  {product?.material || "—"}
                </span>
              </div>

              <div className={styles.specificationRow}>
                <span className={styles.specificationLabel}>Giới tính</span>
                <span className={styles.specificationValue}>
                  {GENDER_LABEL[product?.gender_target] || "—"}
                </span>
              </div>

              <div className={styles.specificationRowAlt}>
                <span className={styles.specificationLabel}>Tình trạng</span>
                <span className={styles.specificationValue}>
                  {STATUS_LABEL[product?.status] || "—"}
                </span>
              </div>

              {product?.care_instruction && (
                <div className={styles.specificationRow}>
                  <span className={styles.specificationLabel}>Bảo quản</span>
                  <span className={styles.specificationValue}>
                    {product.care_instruction}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className={styles.reviews}>
            <div className={styles.ratingSummary}>
              <div className={styles.ratingSummaryScore}>
                <span className={styles.ratingBigNumber}>
                  {avgRating.toFixed(1)}
                </span>
                <span className={styles.ratingOutOf}>/ 5.0</span>
                <div className={styles.ratingSummaryStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < Math.round(avgRating)
                          ? styles.starFilled
                          : styles.starEmpty
                      }
                    />
                  ))}
                </div>
                <span className={styles.ratingSummaryCount}>
                  Dựa trên {totalReviews} đánh giá
                </span>

                {totalReviews > 0 && (
                  <div className={styles.recommendRow}>
                    <CheckCircle2 className={styles.recommendIcon} />
                    <span>{Math.round((recommendCount / totalReviews) * 100)}% khách hàng khuyên dùng sản phẩm này</span>
                  </div>
                )}

                {!showReviewForm && (
                  <button
                    type="button"
                    id="write-review-toggle-btn"
                    onClick={handleToggleReviewForm}
                    className={styles.writeReviewButton}
                  >
                    <PenLine className={styles.writeReviewIcon} />
                    <span>Viết đánh giá</span>
                  </button>
                )}
              </div>

              <div className={styles.ratingBreakdown}>
                {STAR_BUCKETS.map((star) => {
                  const count = breakdown[star] ?? breakdown[String(star)] ?? 0;
                  const percent =
                    totalReviews > 0
                      ? Math.round((count / totalReviews) * 100)
                      : 0;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleToggleRatingFilter(star)}
                      className={`${styles.breakdownRow} ${ratingFilter === star ? styles.breakdownRowActive : ""}`}
                    >
                      <span className={styles.breakdownStarLabel}>
                        <span>{star}</span>
                        <Star className={styles.breakdownStarIcon} />
                      </span>
                      <span className={styles.breakdownBarTrack}>
                        <span
                          className={styles.breakdownBarFill}
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className={styles.breakdownCount}>
                        {count} ({percent}%)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {showReviewForm && (
              <ReviewForm
                productName={product?.name}
                productId={productId}
                onCancel={() => setShowReviewForm(false)}
                onSubmitted={handleReviewSubmitted}
              />
            )}

            <div className={styles.reviewToolbar}>
              <div className={styles.ratingChips}>
                <button
                  type="button"
                  onClick={() => setRatingFilter(null)}
                  className={`${styles.ratingChip} ${ratingFilter === null ? styles.ratingChipActive : ""}`}
                >
                  Tất cả ({totalReviews})
                </button>
                {STAR_BUCKETS.map((star) => {
                  const count = breakdown[star] ?? breakdown[String(star)] ?? 0;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleToggleRatingFilter(star)}
                      className={`${styles.ratingChip} ${ratingFilter === star ? styles.ratingChipActive : ""}`}
                    >
                      {star} <Star className={styles.chipStarIcon} /> ({count})
                    </button>
                  );
                })}
              </div>

              <div className={styles.searchSortRow}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder="Tìm trong đánh giá (vd: chất liệu, form dáng...)"
                  className={styles.searchInput}
                />

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={styles.sortSelect}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingReviews && reviews.length === 0 && (
              <p className={styles.loadingText}>Đang tải đánh giá...</p>
            )}

            {reviewsError && <p className={styles.errorText}>{reviewsError}</p>}

            {!isLoadingReviews && !reviewsError && reviews.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <ImageOff className={styles.emptyIcon} />
                </div>

                <h4 className={styles.emptyTitle}>
                  Không tìm thấy đánh giá phù hợp
                </h4>

                <p className={styles.emptyDescription}>
                  Hãy thử đặt lại bộ lọc hoặc từ khóa tìm kiếm để xem thêm đánh
                  giá.
                </p>

                {(ratingFilter !== null || searchKeyword) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={styles.clearFiltersButton}
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>
            )}

            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}

            {nextReviewsUrl && (
              <div className={styles.loadMoreWrapper}>
                <button
                  type="button"
                  onClick={() => loadReviews(nextReviewsUrl)}
                  disabled={isLoadingReviews}
                  className={styles.loadMoreButton}
                >
                  {isLoadingReviews ? "Đang tải..." : "Xem thêm đánh giá"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;