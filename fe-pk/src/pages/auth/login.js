import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
    <div className="flex h-screen">
      <div className="lg:block hidden w-1/2 h-screen bg-green-600"></div>
      <div className="lg:w-1/2 w-full h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-8">Login Akun</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded focus:border-green-500 focus:ring-2 focus:outline-none transition duration-300"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded focus:border-green-500 focus:ring-2 focus:outline-none transition duration-300"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-green-500 text-white py-2 rounded hover:bg-green-600 focus:ring-2 focus:outline-green-500 transition duration-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
