import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Check, Minus } from 'lucide-react';
import { authApis, endpoints } from '../../configs/Apis';
import { useCart } from '../../configs/Context';
import Navbar from '../../components/Navbar/Navbar';
import CartItemCard from '../../components/CartItemCard/CartItemCard';
import OrderSummary from '../../components/OrderSummary/OrderSummary';
import RemoveCartItemModal from '../../components/RemoveCartItemModal/RemoveCartItemModal';
import ClearCartModal from '../../components/ClearCartModal/ClearCartModal';
import CartEmptyState from '../../components/CartEmptyState/CartEmptyState';
import CartSkeleton from '../../components/CartSkeleton/CartSkeleton';
import styles from './Cart.module.css';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    isLoadingCart,
    cartError,
    fetchCart,
    updateQuantity,
    removeItem,
    extractApiError,
  } = useCart();

  const [currentUser, setCurrentUser] = useState(null);
  const [removeModal, setRemoveModal] = useState({ isOpen: false, item: null });
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [banner, setBanner] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    authApis
      .get(endpoints['current-user'])
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error('Không lấy được thông tin người dùng:', err));
  }, []);

  
  useEffect(() => {
    setSelectedIds((prev) => {
      const stillExisting = prev.filter((id) => cartItems.some((item) => item.id === id));
      if (stillExisting.length === 0 && cartItems.length > 0 && prev.length === 0) {
        return cartItems.filter((item) => Number(item.variant?.stock_qty ?? 0) > 0).map((item) => item.id);
      }
      return stillExisting;
    });
  }, [cartItems]);

  const selectableItems = useMemo(() => cartItems.filter((item) => Number(item.variant?.stock_qty ?? 0) > 0), [cartItems]);
  const selectedItems = useMemo(() => cartItems.filter((item) => selectedIds.includes(item.id)), [cartItems, selectedIds]);

  const isAllSelected = selectableItems.length > 0 && selectedIds.length === selectableItems.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < selectableItems.length;

  const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0),
    [selectedItems]
  );
  const hasOutOfStockItems = useMemo(
    () => cartItems.some((item) => Number(item.variant?.stock_qty ?? 0) <= 0),
    [cartItems]
  );

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : selectableItems.map((item) => item.id));
  };

  const handleToggleSelectItem = (item) => {
    setSelectedIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
  };

  const handleUpdateQuantity = async (item, newQuantity) => {
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (err) {
      throw new Error(extractApiError(err, 'Cập nhật số lượng thất bại.'));
    }
  };

  const handleOpenRemove = (item) => setRemoveModal({ isOpen: true, item });
  const handleCloseRemove = () => setRemoveModal((prev) => ({ ...prev, isOpen: false }));

  const handleConfirmRemove = async (item) => {
    try {
      await removeItem(item.id);
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      showBanner('success', 'Đã xoá sản phẩm khỏi giỏ hàng.');
    } catch (err) {
      throw new Error(extractApiError(err, 'Xoá sản phẩm thất bại.'));
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      await Promise.all(cartItems.map((item) => removeItem(item.id)));
      setSelectedIds([]);
      showBanner('success', 'Đã xoá toàn bộ giỏ hàng.');
    } catch (err) {
      throw new Error(extractApiError(err, 'Xoá giỏ hàng thất bại.'));
    }
  };

  return (
    <>
      <Navbar activePage="cart" currentUser={currentUser} onOpenLogoutModal={() => {}} onOpenAIStylist={() => {}} />

      <main id="shopping-cart-page" className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <button type="button" onClick={() => navigate('/products')} className={styles.backLink}>
              <ArrowLeft className={styles.backIcon} />
              <span>Tiếp tục mua sắm</span>
            </button>

            <div className={styles.titleRow}>
              <h1 className={styles.title}>Giỏ hàng</h1>
              {cartItems.length > 0 && <span className={styles.itemBadge}>{itemCount} sản phẩm</span>}
            </div>
            <p className={styles.subtitle}>Xem lại và cập nhật các sản phẩm trong giỏ hàng của bạn</p>
          </div>

          {cartItems.length > 0 && (
            <button type="button" onClick={() => setIsClearModalOpen(true)} className={styles.clearAllButton}>
              <Trash2 className={styles.clearAllIcon} />
              <span>Xoá tất cả</span>
            </button>
          )}
        </div>

        {banner && (
          <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>
            {banner.message}
          </div>
        )}

        {isLoadingCart ? (
          <CartSkeleton />
        ) : cartError ? (
          <div className={styles.errorState}>
            <p>{cartError}</p>
            <button type="button" onClick={fetchCart} className={styles.retryButton}>
              Thử lại
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className={styles.grid}>
            <div className={styles.itemsColumn}>
              <div id="cart-select-all-bar" className={styles.selectAllBar}>
                <div className={styles.selectAllLeft}>
                  <button
                    type="button"
                    id="cart-select-all-checkbox"
                    role="checkbox"
                    aria-checked={isAllSelected ? true : isIndeterminate ? 'mixed' : false}
                    onClick={handleToggleSelectAll}
                    className={`${styles.selectAllCheckbox} ${isAllSelected || isIndeterminate ? styles.selectAllCheckboxActive : ''}`}
                  >
                    {isAllSelected ? <Check className={styles.selectAllIcon} /> : isIndeterminate ? <Minus className={styles.selectAllIcon} /> : null}
                  </button>
                  <button type="button" onClick={handleToggleSelectAll} className={styles.selectAllLabel}>
                    <span>Chọn tất cả</span>
                    <span className={styles.selectAllCount}>({selectedIds.length} đã chọn)</span>
                  </button>
                </div>

                {selectedIds.length > 0 && (
                  <button type="button" onClick={() => setSelectedIds([])} className={styles.clearSelectionButton}>
                    Bỏ chọn
                  </button>
                )}
              </div>

              {cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={handleToggleSelectItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRequestRemove={handleOpenRemove}
                  onSelectProduct={(productId) => navigate(`/products/${productId}`)}
                />
              ))}
            </div>

            <div className={styles.summaryColumn}>
              <OrderSummary
                itemCount={itemCount}
                subtotal={selectedSubtotal}
                hasOutOfStockItems={hasOutOfStockItems}
                selectedItemIds={selectedIds}
              />
            </div>
          </div>
        )}
      </main>

      <RemoveCartItemModal
        isOpen={removeModal.isOpen}
        item={removeModal.item}
        onClose={handleCloseRemove}
        onConfirm={handleConfirmRemove}
      />

      <ClearCartModal
        isOpen={isClearModalOpen}
        itemCount={itemCount}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearAll}
      />
    </>
  );
}