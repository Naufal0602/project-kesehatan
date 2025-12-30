import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "../pages/auth/register"; 
import WaitingPage from "../pages/auth/waitingPage";
import RegisterPendingUser  from "../pages/auth/register_user";
import Login from "../pages/auth/login";
import ResetPassword from "../pages/auth/ResetPassword";

import SuperAdminDashboard from "../pages/super_admin/dashboard";
import SuperAdminConfirmAdmin from "../pages/super_admin/confirm_admin";
import SuperAdminListAkun from "../pages/super_admin/daftar_akun";

import AdminDashboard from "../pages/admin/dashboard";
import Tingkatan from "../pages/admin/tingkatan";
import ConfirmAccount from "../pages/admin/confirm_account";
import DaftarAccount from "../pages/admin/daftar_account";

import DataUmum from "../pages/admin/data_umum/index";
import DataMateri from "../pages/admin/data_materi/index";
import AdminDataPenyakit from "../pages/admin/data_penyakit/index";
import AdminDataAntisipasi from "../pages/admin/data_penyakit/data_antisipasi";
import AdminProfile from "../pages/admin/profile/user_profil";
import AdminProfileEdit from "../pages/admin/profile/edit_profil";



import UserDashboard from "../pages/user/dashboard";
import UserDataUmum from "../pages/user/data_umum/index";
import UserDataPenyakit from "../pages/user/data_penyakit/index";
import UserDataMateri from "../pages/user/data_materi/index";
import UserProfile from "../pages/user/profile/user_profil";
import UserProfileEdit from "../pages/user/profile/edit_profil";
import UserDataAntisipasi from "../pages/user/data_antisipasi/index";

import AdminEditAntisipasiObat from "../pages/admin/data_penyakit/edit_antisipasi_obat";
import AdminEditAntisipasi from "../pages/admin/data_penyakit/edit_antisipasi";


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
          <Route path="/reset-password" element={<ResetPassword />} />

        {/* halaman public */}
        <Route path="/registerAdmin" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* halaman super admin, hanya bisa diakses role: 'super_admin' */}
        <Route element={<ProtectedRouteByRole allowedRole="super_admin" />}>
          <Route path="/super_admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super_admin/confirm-admin" element={<SuperAdminConfirmAdmin />} />
          <Route path="/super_admin/daftar_akun" element={<SuperAdminListAkun />} />
        </Route>

        {/* halaman admin, hanya bisa diakses role: 'admin' */}
        <Route element={<ProtectedRouteByRole allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/confirm-account" element={<ConfirmAccount />} />
          <Route path="/admin/tingkatan" element={<Tingkatan />} />
          <Route path="/admin/daftar-account" element={<DaftarAccount />} />
          <Route path="/admin/data_umum/index" element={<DataUmum />} />
          <Route path="/admin/data_materi/index" element={<DataMateri />} />
          <Route path="/admin/data_penyakit/index" element={<AdminDataPenyakit />} />
          <Route path="/admin/data_penyakit/data_antisipasi" element={<AdminDataAntisipasi />} />
          <Route path="/admin/data_penyakit/edit_antisipasi/:penyakitId/:index" element={<AdminEditAntisipasi />}/>
          <Route path="/admin/data_penyakit/edit_antisipasi_obat/:penyakitId/:obatId" element={<AdminEditAntisipasiObat />} />
          <Route path="/admin/profile/user_profil" element={<AdminProfile />} />
          <Route path="/admin/profile/edit_profil" element={<AdminProfileEdit />} />
        </Route>

        {/* halaman user, hanya bisa diakses role: 'user' */}
        <Route element={<ProtectedRouteByRole allowedRole="user" />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/data_materi/index" element={<UserDataMateri />} />
          <Route path="/user/data_umum/index" element={<UserDataUmum />} />
          <Route path="/user/data_penyakit/index" element={<UserDataPenyakit />} />
          <Route path="/user/profile/user_profil" element={<UserProfile />} />
          <Route path="/user/profile/edit_profil" element={<UserProfileEdit />} />
          <Route path="/user/data_antisipasi/index" element={<UserDataAntisipasi />} />
        </Route>

        {/* fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
