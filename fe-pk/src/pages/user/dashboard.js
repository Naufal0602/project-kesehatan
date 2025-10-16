import React from "react";


import LogoutButton from "../../components/logout_button";
const UserDashboard = () => {
  



  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">User Dashboard</h1>
      <p>Selamat datang, Pengguna 👤</p>
      
      <LogoutButton />
    </div>
  );
};

export default UserDashboard;
