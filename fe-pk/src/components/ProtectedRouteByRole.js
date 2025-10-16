// src/components/ProtectedRouteByRole.jsx
import { Navigate, Outlet } from "react-router-dom";
import NotFound from "../pages/errors/404"; // pastikan path sesuai

const ProtectedRouteByRole = ({ allowedRole }) => {
  const userData = JSON.parse(localStorage.getItem("user"));

  // jika belum login -> ke login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // kalau allowedRole bisa array atau string
  const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  // kalau role user tidak cocok -> tampilkan halaman 404
  if (!roles.includes(userData.role)) {
    return <NotFound />;
  }


  return <Outlet />;
};

export default ProtectedRouteByRole;
