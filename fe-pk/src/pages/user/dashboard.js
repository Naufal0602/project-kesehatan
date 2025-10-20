import React from "react";
import LogoutButton from "../../components/logout_button";
import SidebarUser from "../../components/sidebar_user";

const UserDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <SidebarUser />
      </div>
      <div className="lg:ml-64 mt-14 p-8 w-full text-center">
        <div className="bg-white p-12 rounded-lg shadow-md inline-block">
          <h1 className="text-2xl font-bold">User Dashboard</h1>
          <p>Selamat datang, Pengguna 👤</p>

          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
