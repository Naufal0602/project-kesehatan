import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "../pages/auth/register"; 
import WaitingPage from "../pages/auth/waitingPage";
import RegisterPendingUser  from "../pages/auth/register_user";
import Login from "../pages/auth/login";

import AdminDashboard from "../pages/admin/dashboard";
import Tingkatan from "../pages/admin/tingkatan";
import ConfirmAccount from "../pages/admin/confirm_account";
import DaftarAccount from "../pages/admin/daftar_account";

import UserDashboard from "../pages/user/dashboard";
import InformasiPengguna from "../pages/user/informasi_pengguna";
import NotFound from "../pages/errors/404";
import ProtectedRouteByRole from "../components/ProtectedRouteByRole";


function App() {
  return (
    <Router>
      <Routes>
        {/* redirect root ke /register */}
        <Route path="/" element={<Navigate to="/register" />} />
          <Route path="/register" element={<RegisterPendingUser />} />
          <Route path="/waiting" element={<WaitingPage />} />
          <Route path="/admin/confirm-account" element={<ConfirmAccount />} />

        {/* halaman public */}
        <Route path="/registerAdmin" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* halaman admin, hanya bisa diakses role: 'admin' */}
        <Route element={<ProtectedRouteByRole allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Tambahkan route admin lainnya di sini */}
          <Route path="/admin/tingkatan" element={<Tingkatan />} />
          <Route path="/admin/daftar-account" element={<DaftarAccount />} />
        </Route>

        {/* halaman user, hanya bisa diakses role: 'user' */}
        <Route element={<ProtectedRouteByRole allowedRole="user" />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/informasi-pengguna" element={<InformasiPengguna />} />
        </Route>

        {/* fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
