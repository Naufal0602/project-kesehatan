import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "../pages/auth/register"; 
import WaitingPage from "../pages/auth/waitingPage";
import RegisterPendingUser  from "../pages/auth/register_user";
import Login from "../pages/auth/login";

import AdminDashboard from "../pages/admin/dashboard";
import Tingkatan from "../pages/admin/tingkatan";
import ConfirmAccount from "../pages/admin/confirm_account";
import DaftarAccount from "../pages/admin/daftar_account";

import DataUmum from "../pages/admin/data_umum/index";
import DataMateri from "../pages/admin/data_materi/index";
import AdminDataPenyakit from "../pages/admin/data_penyakit/index";



import UserDashboard from "../pages/user/dashboard";
import UserDataUmum from "../pages/user/data_umum/index";
import UserDataPenyakit from "../pages/user/data_penyakit/index";


import NotFound from "../pages/errors/404";
import ProtectedRouteByRole from "../components/ProtectedRouteByRole";


function App() {
  return (
    <Router>
      <Routes>
        {/* redirect root ke /register */}
        <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<RegisterPendingUser />} />
          <Route path="/waiting" element={<WaitingPage />} />

        {/* halaman public */}
        <Route path="/registerAdmin" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* halaman admin, hanya bisa diakses role: 'admin' */}
        <Route element={<ProtectedRouteByRole allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/confirm-account" element={<ConfirmAccount />} />
          <Route path="/admin/tingkatan" element={<Tingkatan />} />
          <Route path="/admin/daftar-account" element={<DaftarAccount />} />
          <Route path="/admin/data_umum/index" element={<DataUmum />} />
          <Route path="/admin/data_materi/index" element={<DataMateri />} />
          <Route path="/admin/data_penyakit/index" element={<AdminDataPenyakit />} />
        </Route>

        {/* halaman user, hanya bisa diakses role: 'user' */}
        <Route element={<ProtectedRouteByRole allowedRole="user" />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/data_umum/index" element={<UserDataUmum />} />
          <Route path="/user/data_penyakit/index" element={<UserDataPenyakit />} />
        </Route>

        {/* fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
