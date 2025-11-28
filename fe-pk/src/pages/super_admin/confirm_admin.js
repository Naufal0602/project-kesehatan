import React, { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar_super_admin";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../services/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { CheckCircle, XCircle, Loader2, Eye, X } from "lucide-react";

const ConfirmAccount = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Ambil data pending_users
  useEffect(() => {
    const fetchPendingUsers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "pending_admin"));
        const users = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // Ambil nama_tingkatan dari koleksi tingkatan
            let nama_tingkatan = "-";
            if (data.id_tingkatan) {
              const tingkatanDoc = await getDoc(
                doc(db, "tingkatan", data.id_tingkatan)
              );
              if (tingkatanDoc.exists()) {
                nama_tingkatan = tingkatanDoc.data().nama_tingkatan;
              }
            }

            return {
              id: docSnap.id,
              ...data,
              nama_tingkatan,
            };
          })
        );

        setPendingUsers(users);
      } catch (err) {
        console.error("Gagal mengambil data pending_admin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, [refresh]);

  // ✅ Fungsi Terima
  const handleAccept = async (user) => {
    if (!window.confirm(`Terima akun ${user.nama}?`)) return;
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
        role: "admin",
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
        public_id: user.public_id || "",
        resource_type: user.resource_type || "raw",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      await deleteDoc(doc(db, "pending_admin", user.id));

      alert("✅ Akun berhasil diterima dan dibuat di Auth + Firestore!");
      setShowModal(false);
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
    if (!window.confirm(`Tolak akun ${user.nama}?`)) return;
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3030/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: user.public_id,
          resource_type: user.resource_type,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error("❌ Gagal hapus foto di Cloudinary:", result);
        alert(
          "Gagal menghapus foto di Cloudinary. Data belum dihapus dari Firestore."
        );
        return;
      }

      await deleteDoc(doc(db, "pending_admin", user.id));

      alert("❌ Akun berhasil ditolak dan foto di Cloudinary dihapus!");
      setShowModal(false);
      setRefresh(!refresh);
    } catch (error) {
      console.error("Error saat menolak akun:", error);
      alert("Terjadi kesalahan saat menolak akun.");
    } finally {
      setLoading(false);
    }
  };

  // 👁️ Fungsi Lihat Detail
  const handleView = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
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
                  <th className="py-3 px-4 text-left hidden md:table-cell capitalize">
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
                      {user.nama_tingkatan || "-"}
                    </td>
                    <td className="py-3 px-4 flex flex-col sm:flex-row justify-center items-center gap-2">
                      <button
                        onClick={() => handleView(user)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center gap-1 w-full sm:w-auto justify-center"
                      >
                        <Eye size={18} />
                        Proses
                      </button>
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

      {/* 🔹 Modal Detail User */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative p-6 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-green-600 mb-4">
              Detail Akun Pending
            </h2>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Nama:</strong> {selectedUser.nama}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Lembaga:</strong> {selectedUser.lembaga}
              </p>
              <p>
                <strong>Tingkatan:</strong> {selectedUser.nama_tingkatan}
              </p>
              <p>
                <strong>NRP:</strong> {selectedUser.nrp}
              </p>
              <p>
                <strong>Jenis Kelamin:</strong> {selectedUser.jenis_kelamin}
              </p>
              <p>
                <strong>Tempat, Tanggal Lahir:</strong> {selectedUser.ttl}
              </p>
              <p>
                <strong>Cabang:</strong> {selectedUser.cabang}
              </p>
              <p>
                <strong>KTA:</strong> {selectedUser.kta}
              </p>
              <p>
                <strong>LSPSN:</strong> {selectedUser.lspsn}
              </p>

              {selectedUser.foto && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Foto:</p>
                  <img
                    src={selectedUser.foto}
                    alt="Foto User"
                    className="w-48 h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* 🔘 Tombol aksi dalam modal */}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmAccount;
