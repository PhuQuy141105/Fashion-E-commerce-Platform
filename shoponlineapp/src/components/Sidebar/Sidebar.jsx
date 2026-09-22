import { Package, Boxes, ShoppingBag, Star, Ticket, Users, LogOut, Store, X, HandCoins, Truck } from 'lucide-react';
import styles from './Sidebar.module.css';

const ADMIN_MENU_ITEMS = [
  { id: 'products', label: 'Sản phẩm', icon: Package, path: '/admin/products' },
  { id: 'inventory', label: 'Tồn kho', icon: Boxes, path: '/admin/inventory' },
  { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, path: '/admin/orders' },
  { id: 'cod-reconciliation', label: 'Đối soát COD', icon: HandCoins, path: '/admin/cod-reconciliation' },
  { id: 'reviews', label: 'Đánh giá sản phẩm', icon: Star, path: '/admin/reviews' },
  { id: 'vouchers', label: 'Mã giảm giá', icon: Ticket, path: '/admin/vouchers' },
];
const SHIPPER_MENU_ITEMS = [
  { id: 'deliveries', label: 'Đơn hàng giao', icon: Truck, path: '/shipper/deliveries' },
  { id: 'shipper-cod-reconciliation', label: 'Đối soát COD', icon: HandCoins, path: '/shipper/cod-remittance' }, 
];

export const Sidebar = ({ role = 'ADMIN', currentPage, onNavigate, onLogout, onPreviewStore, isMobileOpen = false, onCloseMobile }) => {
  const menuItems = role === 'SHIPPER' ? SHIPPER_MENU_ITEMS : ADMIN_MENU_ITEMS;
  const sectionLabel = role === 'SHIPPER' ? 'Giao hàng' : 'Quản lý';
  return (
    <>
      {isMobileOpen && <div onClick={onCloseMobile} className={styles.mobileBackdrop} />}

      <aside id="admin-sidebar" className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
        <div>
          <div className={styles.brandRow}>
            <div className={styles.brand}>
              <span className={styles.brandLetter}>W</span>
              <span className={styles.brandName}>ATELIER</span>
              
            </div>

            {onCloseMobile && (
              <button type="button" onClick={onCloseMobile} className={styles.closeMobileButton}>
                <X />
              </button>
            )}
          </div>

          <div className={styles.navSection}>
            <div className={styles.navSectionLabel}>{sectionLabel}</div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              if (item.disabled) {
                return (
                  <div key={item.id} className={styles.navItemDisabled}>
                    <div className={styles.navItemLeft}>
                      <Icon className={styles.navIconDisabled} />
                      <span>{item.label}</span>
                    </div>
                    <span className={styles.comingSoonBadge}>Sắp có</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`admin-nav-${item.id}`}
                  onClick={() => {
                    onNavigate(item.path);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  <div className={styles.navItemLeft}>
                    <Icon className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" id="admin-preview-storefront-btn" onClick={onPreviewStore} className={styles.storefrontButton}>
            <Store className={styles.storefrontIcon} />
            <span>Xem trang khách hàng</span>
          </button>

          <button type="button" id="admin-sidebar-logout-btn" onClick={onLogout} className={styles.logoutButton}>
            <LogOut className={styles.logoutIcon} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;