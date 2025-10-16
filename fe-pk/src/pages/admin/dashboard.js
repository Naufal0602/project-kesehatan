import React from "react";
// import { auth } from "../../services/firebaseConfig";
// import { signOut } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar";

const AdminDashboard = () => {
  // const navigate = useNavigate();

  // const handleLogout = async () => {
  //   await signOut(auth);
  //   navigate("/login");
  // };

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
