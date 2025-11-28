import React from "react";
import Sidebar from "../../components/sidebar_super_admin";

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
        <div className="fixed top-0 left-0">
      <Sidebar />
        </div>
      <div className="lg:ml-64 mt-14 p-8 w-full text-center">
        <h1 className="text-7xl text-green-500 font-bold text-center dynapuff">MoveOn</h1>
        <h2 className="text-xl tracking-wide font-bold text-green-600 dynapuff">Saatnya Bergerak, Saatnya MoveOn</h2>  
      </div>
    </div>
  );
};

export default AdminDashboard;
