import Login from "./pages/Login/Login";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Address from "./pages/Address/Address";
import { CartProvider } from "./configs/Context";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import OrderHistory from "./pages/OrderHistory/OrderHistory";
import OrderDetail from "./pages/OrderDetail/OrderDetail";
import AdminProducts from "./pages/AdminProduct/AdminProduct";
import AdminVariant from "./pages/AdminVariant/AdminVariant";
import AdminInventory from "./pages/AdminInventory/AdminInventory";
import AdminOrders from "./pages/AdminOrders/AdminOrders";
import AdminCODReconciliation from "./pages/AdminCODReconciliation/AdminCODReconciliation";
import AdminReviews from "./pages/AdminReviews/AdminReviews";
import AdminVouchers from "./pages/AdminVouchers/AdminVouchers";
import Delivery from "./pages/Delivery/Delivery";
import ShipperCODReconciliation from "./pages/ShipperCODReconciliation/ShipperCODReconciliation";

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/addresses" element={<Address />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path='/orders' element={<OrderHistory/>}/>
        <Route path='/orders/:id' element={<OrderDetail/>}/>
        <Route path='/admin/products' element={<AdminProducts/>}/>
        <Route path='/admin/products/:id/variants' element={<AdminVariant/>}/>
        <Route path='/admin/inventory' element={<AdminInventory/>}/>
        <Route path='/admin/orders' element={<AdminOrders/>}/>
        <Route path='/admin/cod-reconciliation' element={<AdminCODReconciliation/>}/>
        <Route path='/admin/reviews' element={<AdminReviews/>}/>
        <Route path='/admin/vouchers' element={<AdminVouchers/>}/>
        <Route path='/shipper/deliveries' element={<Delivery/>}/>
        <Route path='/shipper/cod-remittance' element={<ShipperCODReconciliation/>}/>
        <Route path='/shipper/deliveries/:id' element={<OrderDetail/>}/>
      </Routes>
    </CartProvider>
  );
}

export default App;
