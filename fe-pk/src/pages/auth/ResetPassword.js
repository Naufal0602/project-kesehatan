import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Link reset password sudah dikirim ke email kamu.");
      setEmail("");
      setTimeout(() => {
      navigate("/login");
      }, 3000);
    } catch (err) {
      setError("Email tidak ditemukan atau terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 sm:p-8">

        {/* ICON */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-4 rounded-full">
            <Mail className="text-green-600" size={32} />
          </div>
        </div>

        {/* TITLE */}
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
          Reset Password
        </h1>
        <p className="text-sm text-gray-500 text-center mt-2 mb-6">
          Masukkan email yang terdaftar, kami akan mengirimkan link reset password
        </p>

        {/* FORM */}
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Email kamu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>
        <Link
                to="/login"
                className="
                      mt-6 block w-full text-center
                      bg-gradient-to-r from-blue-600 to-blue-700
                      text-white font-semibold
                      px-4 py-3 rounded-xl
                      shadow-md
                      transition-all duration-300 ease-out
                      hover:-translate-y-1 hover:shadow-xl hover:from-blue-500 hover:to-blue-700
                      active:translate-y-0 active:shadow-md"
              >
                Kembali
              </Link>

        {/* ALERT */}
        {message && (
          <p className="mt-4 text-green-600 text-sm text-center font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-red-500 text-sm text-center font-medium">
            {error}
          </p>
        )}

        {/* FOOTER */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Pastikan email aktif dan bisa menerima pesan
        </p>
      </div>
    </div>
  );
}
