import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Public Pages
import Home from './pages/public/Home';
import Explore from './pages/public/Explore';
import CoinDetail from './pages/public/CoinDetail';
import About from './pages/public/About';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Customer Pages
import Profile from './pages/customer/Profile';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import OrderDetail from './pages/customer/OrderDetail';
import Wishlist from './pages/customer/Wishlist';
import PaymentHistory from './pages/customer/PaymentHistory';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import CoinManager from './pages/admin/CoinManager';
import CoinForm from './pages/admin/CoinForm';
import CategoryManager from './pages/admin/CategoryManager';
import CountryManager from './pages/admin/CountryManager';
import MintManager from './pages/admin/MintManager';
import OrderManager from './pages/admin/OrderManager';
import UserManager from './pages/admin/UserManager';
import Inventory from './pages/admin/Inventory';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/coins/:slug" element={<CoinDetail />} />
        <Route path="/about" element={<About />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/payments" element={<PaymentHistory />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/coins" element={<CoinManager />} />
          <Route path="/admin/coins/new" element={<CoinForm />} />
          <Route path="/admin/coins/:id/edit" element={<CoinForm />} />
          <Route path="/admin/categories" element={<CategoryManager />} />
          <Route path="/admin/countries" element={<CountryManager />} />
          <Route path="/admin/mints" element={<MintManager />} />
          <Route path="/admin/orders" element={<OrderManager />} />
          <Route path="/admin/users" element={<UserManager />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
