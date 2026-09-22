import axios from "axios";
import { getAccessToken } from "./Token";
export const endpoints = {
    'token': '/o/token/',
    'current-user': '/users/current-user/',
    'users': '/users/',
    'categories': "/categories/",
    'products': '/products/',
    'brands': '/brands/',
    'product-variants': (id) => `/products/${id}/variants/`,
    'variant-detail': (id) => `/variants/${id}/`, 
    'all-variants': '/variants/', 
    'product-detail': (id) => `/products/${id}/`,     
    'product-reviews': (id) => `/products/${id}/reviews/`, 
    'review-detail': (id) => `/reviews/${id}/`,
    'cart': '/cart/',
    'cart-items': '/cart/items/',
    'cart-item-detail': (id) => `/cart/items/${id}/`,
    'user-addresses': '/users/current-user/addresses/',            
    'user-address-detail': (id) => `/users/current-user/addresses/${id}/`,
    'orders': '/orders/',                                   
    'order-preview': '/orders/preview/',                     
    'order-detail': (id) => `/orders/${id}/`,                
    'payment-check-status': (id) => `/payments/${id}/check-status/`,
    'ai-stylist-query': '/ai-stylist/query/',                   
    'ai-stylist-sessions': '/ai-stylist/',                      
    'ai-stylist-session-detail': (id) => `/ai-stylist/sessions/${id}/`,
    'chat-room': '/chat/room/',                                 
    'chat-room-messages': (id) => `/chat/rooms/${id}/messages/`,
    'chat-rooms-list': '/chat/rooms/',                          
    'chat-room-mark-read': (id) => `/chat/rooms/${id}/read/`,
    'ai-stylist-session-detail': (id) => `/ai-stylist/sessions/${id}/`,
    'notifications': '/notifications/',                                
    'notification-detail': (id) => `/notifications/${id}/`,      
    'notification-mark-all-read': '/notifications/read-all/',
    'shippers': '/shippers/',                                          
    'shipper-cod-pending': (id) => `/shippers/${id}/cod-pending/`, 
    'cod-remittances': '/shippers/cod-remittances/',  
    'shipper-my-cod-pending': '/shippers/me/cod-pending/',
    'vouchers': '/vouchers/',                                  
    'voucher-detail': (id) => `/vouchers/${id}/`,
    'order-item-review': (id) => `/order-items/${id}/review/`,
}

const BASE_URL = 'http://192.168.1.60:8000'

export default axios.create({
    baseURL: BASE_URL
})

export const authApis = axios.create({
    baseURL: BASE_URL
})

authApis.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
)