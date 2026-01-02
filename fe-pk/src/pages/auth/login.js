import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "user") {
        navigate("/user/dashboard");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Ambil data user dari Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Ambil role, default user biar ga error
        const role = userData.role?.toLowerCase() || "user";

        // Simpan ke localStorage
        const savedUser = {
          uid: user.uid,
          email: user.email,
          role: role,
        };
        localStorage.setItem("user", JSON.stringify(savedUser));

        // Routing berdasarkan role
        if (role === "super_admin") {
          navigate("/super_admin/dashboard");
        } else if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        setError("Data user tidak ditemukan di Firestore.");
      }
    } catch (err) {
      console.error("Error login:", err);
      if (err.code === "auth/user-not-found")
        setError("Email tidak terdaftar.");
      else if (err.code === "auth/wrong-password") setError("Password salah.");
      else setError("Login gagal: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 lg:bg-green-900 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white lg:bg-green-800 rounded-2xl lg:rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        {/* KIRI (DESKTOP SAJA) */}
        <div className="hidden lg:flex w-1/2 relative bg-white items-center justify-center">
          <div className="absolute inset-0 bg-white rounded-tr-[200px] rounded-br-[200px]"></div>

          <div className="relative z-10 p-10">
            <h1 className="font-bold text-green-800 text-xl mb-4">PROKES</h1>
            <img
              src="/images/Doctors-bro.svg"
              alt="Health Illustration"
              className="w-full h-auto max-w-md"
            />
          </div>
        </div>

        {/* KANAN */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-green-800 lg:bg-green-800">
          <div className="w-full max-w-sm">
            {/* TITLE */}
            <h2 className="text-3xl font-semibold mb-6 text-white lg:text-white text-center lg:text-left">
              Login
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="
              w-full px-4 py-2 rounded-full
              bg-green-700/40 text-gray-800
              border border-gray-300
              focus:ring-2 focus:ring-green-400
              lg:bg-green-700/40 lg:text-white lg:placeholder-white/70 lg:border-none
            "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="
              w-full px-4 py-2 rounded-full
              bg-green-700/40 text-gray-800
              border border-gray-300
              focus:ring-2 focus:ring-green-400
              lg:bg-green-700/40 lg:text-white lg:placeholder-white/70 lg:border-none
            "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="text-sm text-green-600 lg:text-green-200 text-right">
                <Link to="/reset-password">Lupa password?</Link>
              </div>

              <button
                type="submit"
                className="
              w-full py-2 rounded-full font-semibold transition
              bg-green-500 text-white hover:bg-green-600
              lg:bg-green-400 lg:text-green-900 lg:hover:bg-green-300
            "
              >
                Login
              </button>
            </form>

            {error && (
              <p className="text-red-500 text-sm text-center mt-3">{error}</p>
            )}

            <p className="text-sm text-center mt-6 text-white lg:text-green-200">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="text-green-600 lg:text-white underline"
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
