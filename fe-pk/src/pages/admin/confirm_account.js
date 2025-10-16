import React, { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const ConfirmAccount = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);

  // 🔹 Ambil data pending_users
  useEffect(() => {
    const fetchPendingUsers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "pending_users"));
        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingUsers(users);
      } catch (err) {
        console.error("Gagal mengambil data pending_users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, [refresh]);

  // ✅ Fungsi Terima
  const handleAccept = async (user) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      const createdUser = userCredential.user;

      await setDoc(doc(db, "users", createdUser.uid), {
        nama: user.nama,
        email: user.email,
        lembaga: user.lembaga,
        role: "user",
        created_at: serverTimestamp(),
      });

      await setDoc(doc(db, "data_spesifik", createdUser.uid), {
        user_id: createdUser.uid,
        nrp: user.nrp,
        nama: user.nama,
        jenis_kelamin: user.jenis_kelamin,
        ttl: user.ttl,
        lspsn: user.lspsn,
        cabang: user.cabang,
        kta: user.kta,
        id_tingkatan: user.id_tingkatan,
        foto: user.foto || "",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      await deleteDoc(doc(db, "pending_users", user.id));

      alert("✅ Akun berhasil diterima dan dibuat di Auth + Firestore!");
      setRefresh(!refresh);
    } catch (error) {
      console.error("Error saat menerima akun:", error);
      alert("❌ Terjadi kesalahan saat memproses akun. Coba cek console.");
    } finally {
      setLoading(false);
    }
  };

  // ❌ Fungsi Tolak
  const handleReject = async (user) => {
    if (!window.confirm("Yakin ingin menolak akun ini?")) return;
    setLoading(true);
    try {
      if (user.foto && typeof user.foto === "object" && user.foto.public_id) {
        await fetch("http://localhost:3030/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: user.foto.public_id }),
        });
      }

      await deleteDoc(doc(db, "pending_users", user.id));

      alert("❌ Akun berhasil ditolak dan (jika ada) foto di Cloudinary dihapus!");
      setRefresh(!refresh);
    } catch (error) {
      console.error("Error saat menolak akun:", error);
      alert("Terjadi kesalahan saat menolak akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar (disembunyikan di layar kecil) */}
      <div className="md:block fixed top-0 left-0">
        <Sidebar />
      </div>

      <div className="flex-1 md:ml-64 mt-16 md:mt-14 p-4 md:p-8">
        <h1 className="text-2xl font-bold text-green-600 mb-6 text-center md:text-left">
          Daftar Akun Pending
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-green-600">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <p className="text-gray-500 text-center">Tidak ada akun pending.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-green-100 text-green-700 text-sm md:text-base">
                  <th className="py-3 px-4 text-left">Nama</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left hidden sm:table-cell">
                    Lembaga
                  </th>
                  <th className="py-3 px-4 text-left hidden md:table-cell">
                    Tingkatan
                  </th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 text-sm md:text-base"
                  >
                    <td className="py-3 px-4">{user.nama}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {user.lembaga}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell capitalize">
                      {user.id_tingkatan || "-"}
                    </td>
                    <td className="py-3 px-4 flex flex-col sm:flex-row justify-center items-center gap-2">
                      <button
                        onClick={() => handleAccept(user)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md flex items-center gap-1 w-full sm:w-auto justify-center"
                      >
                        <CheckCircle size={18} />
                        Terima
                      </button>
                      <button
                        onClick={() => handleReject(user)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md flex items-center gap-1 w-full sm:w-auto justify-center"
                      >
                        <XCircle size={18} />
                        Tolak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmAccount;
