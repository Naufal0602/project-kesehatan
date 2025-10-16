import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


function Register() {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    lembaga: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { nama, email, password, lembaga } = formData;

      // 1️⃣ Buat akun di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Simpan data tambahan di Firestore
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        nama,
        email,
        role: "user", // default user biasa
        lembaga,
        created_at: serverTimestamp(),
      });

      alert("Registrasi berhasil!");
      setFormData({ nama: "", email: "", password: "", lembaga: "" });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  console.log("Firebase Auth:", auth);

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
      <h2>Daftar Akun Baru</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Nama Lengkap</label>
          <input
            type="text"
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Lembaga</label>
          <input
            type="text"
            name="lembaga"
            value={formData.lembaga}
            onChange={handleChange}
            placeholder="contoh: Klinik Sehat"
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="bg-blue-500 text-center">
        <button type="submit" disabled={loading}>
          {loading ? "Mendaftarkan..." : "Daftar"}
        </button>
      </div>
      </form>
    </div>
  );
}

export default Register;
