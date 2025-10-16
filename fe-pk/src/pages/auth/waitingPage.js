import React from "react";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WaitingPage = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-center p-6">
      <Clock className="w-20 h-20 text-green-600 mb-4 animate-pulse" />
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        Tunggu Sebentar...
      </h1>
      <p className="text-gray-600 max-w-md mb-6">
        Data Anda telah dikirim dan sedang menunggu persetujuan admin.
        Anda akan dapat login setelah akun disetujui.
      </p>

      <button
        onClick={handleBackToLogin}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Kembali ke Login
      </button>
    </div>
  );
};

export default WaitingPage;
