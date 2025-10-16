import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import DataTable from "react-data-table-component";
import { db } from "../../services/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { Loader2, Info, Trash2, Search } from "lucide-react";

const DaftarAccount = () => {
  const [akunList, setAkunList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // untuk modal info
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔹 Ambil data akun dan gabungkan dengan data_spesifik + tingkatan
  const fetchAkun = async () => {
    setLoading(true);
    try {
      const [usersSnap, dataSpesifikSnap, tingkatanSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "data_spesifik")),
        getDocs(collection(db, "tingkatan")),
      ]);

      // 🔹 Map user_id -> data user
      const usersMap = {};
      usersSnap.forEach((u) => {
        usersMap[u.id] = u.data();
      });

      // 🔹 Map id_tingkatan -> nama_tingkatan
      const tingkatanMap = {};
      tingkatanSnap.forEach((t) => {
        tingkatanMap[t.id] = t.data().nama_tingkatan || "-";
      });

      // 🔹 Ambil SEMUA data_spesifik
      const akunData = dataSpesifikSnap.docs.map((doc) => {
        const data = doc.data();
        const user = usersMap[data.user_id] || {}; // ambil data user (kalau ada)
        const namaTingkatan = tingkatanMap[data.id_tingkatan] || "-";

        return {
          id: doc.id,
          ...user, // gabung data user (email, nama, dsb)
          ...data, // gabung data spesifik (user_id, id_tingkatan, dsb)
          nama_tingkatan: namaTingkatan,
        };
      });

      setAkunList(akunData);
    } catch (err) {
      console.error("❌ Error ambil data akun:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAkun();
  }, [refresh]);

  // 🔹 Kolom untuk DataTable

  const columns = [
    { name: "Nama", selector: (row) => row.nama, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Lembaga", selector: (row) => row.lembaga || "-", sortable: true },
    {
      name: "Tingkatan",
      selector: (row) => row.nama_tingkatan || "-",
      sortable: true,
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          {/* Tombol Detail */}
          <button
            onClick={() => {
              setSelectedUser(row);
              setShowModal(true);
            }}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition"
          >
            <Info className="w-4 h-4" /> Detail
          </button>

          {/* Tombol Hapus */}
          <button
            onClick={() => handleDelete(row.id)}
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition"
          >
            <Trash2 className="w-4 h-4" /> Hapus
          </button>
        </div>
      ),
    },
  ];
  const handleDelete = async (user) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    setLoading(true);

    try {
      console.log("Menghapus data dengan ID:", user.id);

      // 🔹 1. Hapus foto di Cloudinary (jika ada public_id)
      if (user.foto && typeof user.foto === "object" && user.foto.public_id) {
        await fetch("http://localhost:3030/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: user.foto.public_id }),
        });
        console.log("🧹 Foto di Cloudinary berhasil dihapus");
      }

      // 🔹 2. Hapus data user dari koleksi "users"
      await deleteDoc(doc(db, "users", user.id));

      // 🔹 3. Cari dan hapus semua data di "data_spesifik" yang terkait user_id
      const dataSpesifikSnap = await getDocs(
        query(collection(db, "data_spesifik"), where("user_id", "==", user.id))
      );

      const deletePromises = dataSpesifikSnap.docs.map((d) =>
        deleteDoc(doc(db, "data_spesifik", d.id))
      );
      await Promise.all(deletePromises);

      alert(
        "✅ Data berhasil dihapus (users, data_spesifik, dan foto Cloudinary)!"
      );
      setRefresh(!refresh);
    } catch (error) {
      console.error("❌ Error menghapus data:", error);
      alert("Terjadi kesalahan saat menghapus data!");
    } finally {
      setLoading(false);
    }
  };

  const filteredAkun = akunList.filter((t) =>
    t.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>
      <div className="lg:ml-64 mt-14 p-8 w-full text-center">
        <h2 className="text-2xl font-semibold mb-6 text-green-600">
          Daftar Akun Pengguna
        </h2>
        <div
          className={`flex items-center border space-y-2 justify-right transition-all duration-300 rounded-lg px-3 py-1 w-full md:w-64 ${
            searchTerm
              ? "border-green-500 shadow-md space-y-2"
              : "border-gray-300 hover:border-green-400"
          }`}
        >
          <Search
            className={`transition-colors ${
              searchTerm ? "text-green-500" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 focus:outline-none text-sm sm:text-base bg-transparent space-y-2"
            placeholder="Cari Tingkatan..."
          />
        </div>

        {/* 🔹 Tabel akun */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
          </div>
        ) : filteredAkun.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-lg font-medium">Akun tidak ditemukan</p>
            <p className="text-sm text-gray-400">
              Coba periksa kembali kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAkun}
            pagination
            highlightOnHover
            striped
            responsive
          />
        )}

        {/* 🔹 Modal Info */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Informasi Akun
              </h3>
              <div className="flex flex-col items-center gap-6 ">
                <img
                  src={selectedUser.foto || "/default-avatar.png"}
                  alt={selectedUser.nama}
                  className="w-48 h-48 rounded-full object-cover border"
                />
                <div className="space-y-1 text-sm text-left w-full">
                  <div className="flex">
                    <span className="w-32 font-semibold">Nama</span>
                    <span>: {selectedUser.nama}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">LSPSN</span>
                    <span>: {selectedUser.lspsn}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">KTA</span>
                    <span>: {selectedUser.kta}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Tanggal Lahir</span>
                    <span>: {selectedUser.ttl}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Email</span>
                    <span>: {selectedUser.email}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Lembaga</span>
                    <span>: {selectedUser.lembaga || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Tingkatan</span>
                    <span>: {selectedUser.nama_tingkatan || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
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
    </div>
  );
};

export default DaftarAccount;
