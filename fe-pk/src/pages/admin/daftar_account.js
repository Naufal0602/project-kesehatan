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
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAkun = async () => {
    setLoading(true);
    try {
      const [usersSnap, dataSpesifikSnap, tingkatanSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "data_spesifik")),
        getDocs(collection(db, "tingkatan")),
      ]);

      const usersMap = {};
      usersSnap.forEach((u) => {
        usersMap[u.id] = u.data();
      });

      const tingkatanMap = {};
      tingkatanSnap.forEach((t) => {
        tingkatanMap[t.id] = t.data().nama_tingkatan || "-";
      });

      const akunData = dataSpesifikSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        const user = usersMap[data.user_id] || {};
        const namaTingkatan = tingkatanMap[data.id_tingkatan] || "-";

        return {
          id: docSnap.id,
          ...user,
          ...data,
          nama_tingkatan: namaTingkatan,
        };
      });

      // Filter: hanya role user
      const filtered = akunData.filter((a) => a.role?.toLowerCase() === "user");

      setAkunList(filtered);
    } catch (err) {
      console.error("❌ Error ambil data akun:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAkun();
  }, [refresh]);

  const columns = [
    { name: "Nama", selector: (row) => row.nama, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Lembaga", selector: (row) => row.lembaga || "-", sortable: true },
    {
      name: "Tingkatan",
      selector: (row) => row.nama_tingkatan || "-",
      sortable: true,
    },
    { name: "Role", selector: (row) => row.role || "-", sortable: true },
    {
      name: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedUser(row);
              setShowModal(true);
            }}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row.user_id)}
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (userId) => {
    console.log("➡️ MULAI DELETE, userId:", userId);

    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    setLoading(true);

    try {
      // Cari object user di akunList
      const userObj =
        akunList.find((a) => a.id === userId || a.user_id === userId) || null;

      console.log("🔎 userObj ditemukan:", userObj);

      // Cek apakah ada public_id untuk delete image
      if (
        userObj &&
        userObj.public_id &&
        typeof userObj.public_id === "string"
      ) {
        console.log("🖼 Menghapus gambar dengan public_id:", userObj.public_id);

        const deleteImageRes = await fetch(
          "https://project-kesehatan.vercel.app/delete",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: userObj.public_id }),
          }
        );

        console.log("📡 Respons hapus gambar:", await deleteImageRes.text());
      } else {
        console.log("⚠️ Tidak ada public_id, skip hapus gambar.");
      }

      // Hapus dokumen di collection 'users'
      console.log(`🔥 Menghapus dokumen users/${userId}`);
      await deleteDoc(doc(db, "users", userId));
      console.log("✔️ Dokumen users berhasil dihapus");

      // Cari data spesifik
      const dataSpesifikSnap = await getDocs(
        query(collection(db, "data_spesifik"), where("user_id", "==", userId))
      );

      console.log("🔎 Data spesifik ditemukan:", dataSpesifikSnap.size);

      if (!dataSpesifikSnap.empty) {
        await Promise.all(
          dataSpesifikSnap.docs.map(async (d) => {
            console.log("🔥 Menghapus data_spesifik:", d.id);
            await deleteDoc(doc(db, "data_spesifik", d.id));
          })
        );
        console.log("✔️ Semua data_spesifik dihapus");
      } else {
        console.log("⚠️ Tidak ada data_spesifik yang cocok, skip.");
      }

      alert("✅ Data berhasil dihapus!");

      setRefresh((r) => !r);
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
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* 🔹 Konten utama */}
      <div className="lg:ml-64 mt-14 p-8 w-full">
        <h2 className="text-2xl font-bold mb-6 text-green-600 text-center md:text-left">
          Daftar Akun Pengguna
        </h2>

        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-6">
          {/* 🔍 Search bar */}
          <div
            className={`flex items-center border justify-right transition-all duration-300 rounded-lg px-3 py-1 w-full md:w-64 ${
              searchTerm
                ? "border-green-500 shadow-md"
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
              className="w-full px-4 focus:outline-none text-sm sm:text-base bg-transparent"
              placeholder="Cari Nama Akun..."
            />
          </div>

          {/* 🔹 Wrapper tabel dengan scroll horizontal */}
          <div className="overflow-x-auto border rounded-lg">
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
          </div>
        </div>

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
                    <span className="w-32 font-semibold">Role</span>
                    <span>: {selectedUser.role}</span>
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
