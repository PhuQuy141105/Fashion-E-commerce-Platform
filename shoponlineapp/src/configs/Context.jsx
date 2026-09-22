import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApis, endpoints } from "./Apis";
import {
  setAccessToken,
  setRefreshToken,
  setUser,
  getUser,
  removeAccessToken,
  removeRefreshToken,
  removeUser,
  getAccessToken,
} from "./Token";


export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [user, setUserState] = useState(getUser());

  const handleLogin = async (username, password) => {
    const res = await authApis.post(endpoints['token'], {
      grant_type: "password",
      username,
      password,
    });

    setAccessToken(res.data.access_token);
    setRefreshToken(res.data.refresh_token);
    const userRes = await authApis.get(endpoints['current-user'], {
      headers: { Authorization: `Bearer ${res.data.access_token}` },
    });
    setUser(userRes.data);
    setUserState(userRes.data);
    setIsAuthenticated(true);
    return userRes.data
  };

  const handleLogout = () => {
    removeAccessToken();
    removeRefreshToken();
    removeUser();
    setUserState(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


export const CartContext = createContext(null);

export function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data)) return data[0] || fallback;
  if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return fallback;
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth() || {};

  const [cartItems, setCartItems] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [cartError, setCartError] = useState(null);

  const fetchCart = useCallback(async () => {
    setIsLoadingCart(true);
    setCartError(null);
    try {
      const { data } = await authApis.get(endpoints['cart']);
      setCartItems(data.results ?? data);
    } catch (err) {
      console.error('Không tải được giỏ hàng:', err);
      setCartError(extractApiError(err, 'Không tải được giỏ hàng.'));
      setCartItems([]);
    } finally {
      setIsLoadingCart(false);
    }
  }, []);


  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCartItems([]);
      setIsLoadingCart(false);
    }
  }, [isAuthenticated, fetchCart]);

  
  const addToCart = useCallback(async (variantId, quantity) => {
    const { data } = await authApis.post(endpoints['cart-items'], { variant: variantId, quantity });
    await fetchCart(); 
    return data;
  }, [fetchCart]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    const { data } = await authApis.patch(endpoints['cart-item-detail'](cartItemId), { quantity });
    setCartItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    return data;
  }, []);

  const removeItem = useCallback(async (cartItemId) => {
    await authApis.delete(endpoints['cart-item-detail'](cartItemId));
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  }, []);

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const cartSubtotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0), [cartItems]);

  const value = {
    cartItems,
    isLoadingCart,
    cartError,
    cartCount,
    cartSubtotal,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    extractApiError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải được dùng bên trong <CartProvider>');
  return ctx;
}