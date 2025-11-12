import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar";
import { db } from "../../services/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { Trash2, Loader2, Pencil, Search } from "lucide-react";

const TambahTingkatan = () => {
  const [namaTingkatan, setNamaTingkatan] = useState("");
  const [tingkatanList, setTingkatanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ id: "", nama: "" });
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Tambahkan state untuk pencarian

  // 🔹 Ambil data tingkatan
  const fetchTingkatan = async () => {
    setFetching(true);
    try {
      const q = query(collection(db, "tingkatan"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTingkatanList(data);
    } catch (error) {
      console.error("Gagal mengambil data tingkatan:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTingkatan();
  }, []);

  // 🔹 Tambah data
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaTingkatan.trim()) {
      alert("Nama tingkatan tidak boleh kosong");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "tingkatan"), {
        nama_tingkatan: namaTingkatan,
        created_at: serverTimestamp(),
      });

      setNamaTingkatan("");
      setSuccessMsg("Data tingkatan berhasil ditambahkan!");
      await fetchTingkatan();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Gagal menambah tingkatan:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Yakin ingin menghapus tingkatan ini?");
    if (!confirm) return;

    setDeleting(id);
    try {
      await deleteDoc(doc(db, "tingkatan", id));
      await fetchTingkatan();
    } catch (error) {
      console.error("Gagal menghapus tingkatan:", error);
      alert("Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleting(null);
    }
  };

  // 🔹 Update data
  const handleUpdate = async () => {
    if (!editData.nama.trim()) return alert("Nama tidak boleh kosong");
    setUpdating(true);
    try {
      await updateDoc(doc(db, "tingkatan", editData.id), {
        nama_tingkatan: editData.nama,
      });
      await fetchTingkatan();
      setShowEditModal(false);
    } catch (error) {
      console.error("Gagal mengupdate:", error);
    } finally {
      setUpdating(false);
    }
  };

  // 🔹 Filter data berdasarkan pencarian
  const filteredTingkatan = tingkatanList.filter((t) =>
    t.nama_tingkatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="md:block fixed top-0 left-0 z-50">
        <Sidebar />
      </div>

      <div className="flex-1 md:ml-64 mt-14 p-4 sm:p-6 w-full">
        <h1 className="text-2xl font-bold mb-6 text-green-600 text-center md:text-left">
          Data Tingkatan
        </h1>

        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="bg-white rounded-2xl shadow p-6 h-full w-full md:max-w-lg">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-green-600 mb-2 font-medium text-sm sm:text-base">
                  Nama Tingkatan
                </label>
                <input
                  type="text"
                  value={namaTingkatan}
                  onChange={(e) => setNamaTingkatan(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm sm:text-base"
                  placeholder="Masukkan nama tingkatan"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto transition-colors"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </form>

            {successMsg && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded text-center text-sm sm:text-base">
                {successMsg}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6 w-full relative h-60 overflow-hidden">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h1 className="font-bold mb-3 text-green-600 text-center md:text-left text-sm sm:text-base">
                Daftar Tingkatan
              </h1>
              <div
                className={`flex items-center border transition-all duration-300 rounded-lg px-3 py-1 w-full md:w-64 ${
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
                  placeholder="Cari Tingkatan..."
                />
              </div>
            </div>

            {fetching ? (
              <div className="flex justify-center items-center h-44">
                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 h-40 overflow-y-auto">
                {filteredTingkatan.map((t) => (
                  <div
                    key={t.id}
                    className="group flex justify-between items-center border border-green-400 px-4 py-2 rounded-xl hover:bg-green-50 transition"
                  >
                    <p className="text-gray-700 font-medium text-sm sm:text-base break-words">
                      {t.nama_tingkatan}
                    </p>

                    <div className="flex gap-2 items-center">
                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditData({ id: t.id, nama: t.nama_tingkatan });
                          setShowEditModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-green-500 hover:text-green-700"
                      >
                        <Pencil />
                      </button>

                      {/* Hapus */}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        {deleting === t.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {filteredTingkatan.length === 0 && (
                  <p className="text-gray-400 text-center text-sm sm:text-base">
                    Tidak ada data yang cocok.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-green-600">
              Edit Tingkatan
            </h2>
            <input
              type="text"
              value={editData.nama}
              onChange={(e) =>
                setEditData({ ...editData, nama: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
              >
                Batal
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {updating ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TambahTingkatan;
