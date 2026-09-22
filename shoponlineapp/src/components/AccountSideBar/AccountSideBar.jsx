import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, ShoppingBag, CreditCard, Heart, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import styles from './AccountSidebar.module.css';

const PAGE_PATHS = {
  addresses: '/addresses',
  orders: '/orders',
  payment: '/payment',
  wishlist: '/wishlist',
  security: '/security',
};

const MENU_ITEMS = [
  { id: 'addresses', label: 'Địa chỉ giao hàng', icon: MapPin },
  { id: 'orders', label: 'Lịch sử đơn hàng', icon: ShoppingBag },
  { id: 'payment', label: 'Phương thức thanh toán', icon: CreditCard },
  { id: 'wishlist', label: 'Danh sách yêu thích', icon: Heart },
  { id: 'security', label: 'Bảo mật & Quyền riêng tư', icon: ShieldCheck },
];

export const AccountSidebar = ({ currentPage = 'addresses', onLogout = () => {}, currentUser }) => {
  const navigate = useNavigate();
  const displayName = (currentUser?.last_name || ' ') + ' ' + (currentUser?.first_name || ' ' )
  const avatarInitial = (currentUser?.full_name || currentUser?.username || '?').charAt(0).toUpperCase();
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{avatarInitial}</div>
          <div className={styles.userInfo}>
            <h4 className={styles.userName}>{displayName}</h4>
            <p className={styles.userEmail}>{currentUser?.email || ''}</p>
            <span className={styles.memberBadge}>Thành viên Atelier</span>
          </div>
        </div>
        <nav className={styles.nav} aria-label="Điều hướng tài khoản">
          {MENU_ITEMS.map((item) => {
            const isActive = item.id === currentPage;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                onClick={() => navigate(PAGE_PATHS[item.id])}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <div className={styles.navItemLeft}>
                  <Icon className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className={styles.chevron} />}
              </button>
            );
          })}
        </nav>
        <div className={styles.signOutWrapper}>
          <button id="sidebar-logout-btn" type="button" onClick={onLogout} className={styles.signOutButton}>
            <LogOut className={styles.signOutIcon} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSidebar;