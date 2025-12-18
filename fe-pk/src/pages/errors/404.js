import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div style={{ textAlign: "center", padding: "100px" }}>
      <h1>404</h1>
      <p>Halaman tidak ditemukan</p>
       <button
        onClick={handleBackToLogin}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Kembali ke Login
      </button>
    </div>
  );
};

export default NotFound;
