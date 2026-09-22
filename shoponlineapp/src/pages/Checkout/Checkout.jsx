import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, AlertTriangle, Lock, ChevronRight } from 'lucide-react';
import { authApis,endpoints } from '../../configs/Apis';
import { useCart } from '../../configs/Context';
import Navbar from '../../components/Navbar/Navbar';
import CheckoutAddressSection from '../../components/CheckoutAddressSection/CheckoutAddressSection';
import CheckoutItems from '../../components/CheckoutItems/CheckoutItems';
import VoucherCard from '../../components/VoucherCard/VoucherCard';
import PaymentMethodSelector from '../../components/PaymentMethodSelector/PaymentMethodSelector';
import CheckoutSummary from '../../components/CheckoutSummary/CheckoutSummary';
import CODSavedSuccessModal from '../../components/CODSavedSuccessModal/CODSavedSuccessModal';
import PayOSEmbedSection from '../../components/PayOSEmbedSection/PayOSEmbedSection';
import DuplicateAddressModal from '../../components/DuplicatedAddressModal/DuplicatedAddressModal';
import styles from './Checkout.module.css';

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, isLoadingCart, fetchCart } = useCart();

  const requestedCartItemIds = location.state?.cartItemIds || null;

  const [currentUser, setCurrentUser] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const [voucherCode, setVoucherCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [step, setStep] = useState('form'); 
  const [placedOrder, setPlacedOrder] = useState(null);
  const [placedPayment, setPlacedPayment] = useState(null);

  useEffect(() => {
    authApis
      .get(endpoints['current-user'])
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error('Không lấy được thông tin người dùng:', err));
  }, []);

  const loadAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const { data } = await authApis.get(endpoints['user-addresses']);
      const list = data.results ?? data;
      setAddresses(list);
      setSelectedAddressId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        const defaultAddr = list.find((a) => a.is_default) || list[0] || null;
        return defaultAddr?.id ?? null;
      });
    } catch (err) {
      console.error('Không tải được danh sách địa chỉ:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const checkoutItems = useMemo(() => {
    if (!requestedCartItemIds) return cartItems;
    return cartItems.filter((item) => requestedCartItemIds.includes(item.id));
  }, [cartItems, requestedCartItemIds]);

  const subtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0),
    [checkoutItems]
  );

  const outOfStockItems = useMemo(
    () => checkoutItems.filter((item) => item.quantity > Number(item.variant?.stock_qty ?? 0)),
    [checkoutItems]
  );

  const loadPreview = async () => {
    if (!selectedAddressId || checkoutItems.length === 0) {
      setPreview(null);
      return;
    }
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const payload = {
        address_id: selectedAddressId,
        cart_item_ids: checkoutItems.map((item) => item.id),
      };
      if (voucherCode.trim()) payload.voucher_code = voucherCode.trim();
      const { data } = await authApis.post(endpoints['order-preview'], payload);
      setPreview(data);
      console.log(data)
    } catch (err) {
      console.error('Không tính được thông tin đơn hàng:', err);
      setPreviewError(extractApiError(err, 'Không tính được thông tin đơn hàng.'));
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(loadPreview, 400);
    return () => clearTimeout(timer);
  }, [selectedAddressId, voucherCode, checkoutItems.length]);

  const handleSubmit = async () => {
    if (!selectedAddressId) return;
    if (!agreedTerms) return;
    if (checkoutItems.length === 0) return;
    if (voucherCode.trim() && preview && preview.voucher_error) {
      setSubmitError(preview.voucher_error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        cart_item_ids: checkoutItems.map((item) => item.id),
      };
      if (voucherCode.trim()) payload.voucher_code = voucherCode.trim();

      const { data } = await authApis.post(endpoints['orders'], payload);

      await fetchCart();

      setPlacedOrder(data.order);
      if (paymentMethod === 'COD') {
        setStep('cod-success');
      } else {
        setPlacedPayment(data.payment);
        setStep('payos');
      }
    } catch (err) {
      console.error('Đặt hàng thất bại:', err);
      setSubmitError(extractApiError(err, 'Đặt hàng thất bại. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'payos' && placedOrder && placedPayment) {
    return (
      <>
        <Navbar activePage="checkout" currentUser={currentUser} onOpenLogoutModal={() => {}} onOpenAIStylist={() => {}} />
        <main className={styles.page}>
          <PayOSEmbedSection order={placedOrder} payment={placedPayment} onBackToCheckout={() => setStep('form')} />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar activePage="checkout" currentUser={currentUser} onOpenLogoutModal={() => {}} onOpenAIStylist={() => {}} />

      <main id="checkout-page" className={styles.page}>
        <div className={styles.headerBlock}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <button type="button" onClick={() => navigate('/products')} className={styles.breadcrumbLink}>
              Trang chủ
            </button>
            <ChevronRight className={styles.breadcrumbArrow} />
            <button type="button" onClick={() => navigate('/cart')} className={styles.breadcrumbLink}>
              Giỏ hàng
            </button>
            <ChevronRight className={styles.breadcrumbArrow} />
            <span className={styles.breadcrumbCurrent}>Thanh toán</span>
          </nav>

          <div className={styles.headerRow}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>Thanh toán</h1>
                <span className={styles.secureBadge}>
                  <Lock className={styles.secureIcon} /> Giao dịch bảo mật
                </span>
              </div>
              <p className={styles.subtitle}>Kiểm tra lại đơn hàng và hoàn tất thanh toán.</p>
            </div>

            <button type="button" onClick={() => navigate('/cart')} className={styles.backButton}>
              <ArrowLeft className={styles.backIcon} />
              <span>Về giỏ hàng</span>
            </button>
          </div>
        </div>

        {outOfStockItems.length > 0 && (
          <div id="checkout-out-of-stock-alert" className={styles.stockWarning}>
            <div className={styles.stockWarningLeft}>
              <AlertTriangle className={styles.stockWarningIcon} />
              <div>
                <p className={styles.stockWarningTitle}>Một số sản phẩm không còn đủ số lượng tồn kho</p>
                <p className={styles.stockWarningText}>Vui lòng quay lại giỏ hàng để điều chỉnh trước khi tiếp tục.</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/cart')} className={styles.stockWarningButton}>
              Về giỏ hàng
            </button>
          </div>
        )}

        {submitError && <div className={styles.submitErrorBanner}>{submitError}</div>}

        {isLoadingCart ? (
          <div className={styles.loadingGrid}>
            <div className={styles.loadingCol}>
              <div className={styles.loadingBlock} />
              <div className={styles.loadingBlock} />
              <div className={styles.loadingBlockSmall} />
            </div>
            <div className={styles.loadingSummary} />
          </div>
        ) : checkoutItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <ShoppingBag className={styles.emptyIcon} />
            </div>
            <div>
              <h2 className={styles.emptyTitle}>Không có sản phẩm nào để thanh toán</h2>
              <p className={styles.emptyText}>Giỏ hàng trống hoặc sản phẩm đã chọn không còn tồn tại.</p>
            </div>
            <button type="button" onClick={() => navigate('/products')} className={styles.emptyButton}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.leftColumn}>
              <CheckoutAddressSection
                addresses={addresses}
                isLoading={isLoadingAddresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={(addr) => setSelectedAddressId(addr.id)}
                onRefreshAddresses={loadAddresses}
                onDuplicate={() => setIsDuplicateModalOpen(true)}
              />

              <CheckoutItems items={checkoutItems} />

              <VoucherCard
                voucherCode={voucherCode}
                onChangeVoucherCode={setVoucherCode}
                isChecking={isLoadingPreview}
                voucherValid={preview?.voucher_valid}
                voucherError={preview?.voucher_error}
                discountAmount={preview?.discount_amount}
              />

              <PaymentMethodSelector selectedMethod={paymentMethod} onSelectMethod={setPaymentMethod} />
            </div>

            <div className={styles.rightColumn}>
              <CheckoutSummary
                itemCount={checkoutItems.reduce((sum, item) => sum + item.quantity, 0)}
                subtotal={preview?.subtotal ?? subtotal}
                shippingFee={preview?.shipping_fee}
                discountAmount={preview?.discount_amount}
                totalAmount={preview?.total_amount}
                isLoadingPreview={isLoadingPreview}
                previewError={previewError}
                paymentMethod={paymentMethod}
                hasSelectedAddress={Boolean(selectedAddressId)}
                agreedTerms={agreedTerms}
                onToggleTerms={setAgreedTerms}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </main>

      <CODSavedSuccessModal isOpen={step === 'cod-success'} order={placedOrder} />

      <DuplicateAddressModal isOpen={isDuplicateModalOpen} onClose={() => setIsDuplicateModalOpen(false)} />
    </>
  );
}