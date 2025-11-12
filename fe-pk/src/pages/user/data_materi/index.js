import React, { useEffect, useState, useMemo, useCallback } from "react";
import SidebarUser from "../../../components/sidebar_user";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../services/firebaseConfig";
import DataTable from "react-data-table-component";
import {
  Loader2,
  Plus,
  Edit,
  X,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
import FullScreenLoader from "../../../components/FullScreenLoader";
import ConfirmModal from "../../../components/ConfirmModal";

  const initialFormData = {
    id: "",
    id_data_umum: "",
    index_masa_tubuh: "",
    kelenturan: "",
    vo2max: "",
    push_up_mnt: "",
    sit_up_mnt: "",
    squad_mnt: "",
    tahan_napas_detik: "",
    tanggal_pengujian: "",
  };
const DataMateriUser = () => {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dataUmumLoading, setDataUmumLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [dataMateri, setDataMateri] = useState([]);
  const [dataUmumList, setDataUmumList] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

// --- Komponen Modal Info Detail ---
const DetailModal = ({ data, onClose }) => {
  const fields = [
    { label: "ID Data Umum", key: "id_data_umum" },
    { label: "Tanggal Pengujian", key: "tanggal_pengujian" },
    { label: "IMT (Index Masa Tubuh)", key: "index_masa_tubuh", unit: "" },
    { label: "Kelenturan", key: "kelenturan", unit: "cm" },
    { label: "VO2Max", key: "vo2max", unit: "mL/(kg.min)" },
    { label: "Push Up (mnt)", key: "push_up_mnt", unit: "kali" },
    { label: "Sit Up (mnt)", key: "sit_up_mnt", unit: "kali" },
    { label: "Squat (mnt)", key: "squad_mnt", unit: "kali" },
    { label: "Tahan Napas (detik)", key: "tahan_napas_detik", unit: "detik" },
  ];

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative shadow-2xl">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          Detail Hasil Pengujian
        </h2>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">{f.label}:</span>
              <span className="font-semibold text-gray-800">
                {data[f.key] || "-"}
                {f.unit && <span className="text-xs font-normal ml-1 text-gray-500">{f.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
  const [formData, setFormData] = useState(initialFormData);

  const user = auth.currentUser;

  // Fungsi untuk reset notifikasi
  const resetNotifications = useCallback(() => {
      setSuccess(false);
      setError(false);
  }, []);

  // 🔹 Ambil data hasil tes kebugaran user
  const fetchDataMateri = useCallback(async () => {
    setLoading(true);
    try {
      if (!user || !user.uid) return;
      const q = query(collection(db, "data_materi"), where("user_uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDataMateri(list);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 🔹 Ambil daftar data umum berdasarkan keberadaan/nilai 'materi'
  const fetchDataUmum = useCallback(async () => {
    setDataUmumLoading(true);
    try {
      // Query: Ambil data_umum di mana field 'materi' BUKAN string kosong.
      const q = query(collection(db, "data_umum"), where("materi", "!=", "")); 
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDataUmumList(list);
    } catch (err) {
      console.error("Gagal memuat data_umum:", err);
    } finally {
      setDataUmumLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDataMateri();
      fetchDataUmum();
    }
  }, [user, fetchDataMateri, fetchDataUmum]);
  
// --- Aksi Tombol DIBUNGKUS useCallBack ---

  const handleView = useCallback((row) => {
    setSelectedData(row);
    setShowDetailModal(true);
    resetNotifications();
  }, [resetNotifications]);

  const handleEdit = useCallback((row) => {
    const stringified = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, String(v ?? "")])
    );
    setFormData(stringified);
    setShowFormModal(true);
    resetNotifications();
  }, [resetNotifications]); // Tambahkan resetNotifications sebagai dependency

  const handleDelete = useCallback((row) => {
    setSelectedData(row);
    setShowDeleteModal(true);
    resetNotifications();
  }, [resetNotifications]); // Tambahkan resetNotifications sebagai dependency

  const handleAdd = useCallback(() => {
    setFormData(initialFormData);
    setShowFormModal(true);
    resetNotifications();
  }, [resetNotifications]); // Tambahkan resetNotifications sebagai dependency

// --- END Aksi Tombol DIBUNGKUS useCallBack ---

  // 🔹 Konfirmasi Hapus Data
  const confirmDelete = async () => {
    if (!selectedData) return;
    setSubmitLoading(true);
    setShowDeleteModal(false);
    try {
      await deleteDoc(doc(db, "data_materi", selectedData.id));
      setSuccess(true);
      fetchDataMateri();
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSubmitLoading(false);
      setTimeout(() => resetNotifications(), 3000);
    }
  };

  // 🔹 Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Simpan data (Tambah/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    resetNotifications();

    try {
      const cleanData = {
        id_data_umum: formData.id_data_umum || "",
        index_masa_tubuh: parseFloat(formData.index_masa_tubuh || 0),
        kelenturan: parseFloat(formData.kelenturan || 0),
        vo2max: parseFloat(formData.vo2max || 0),
        push_up_mnt: parseInt(formData.push_up_mnt || 0, 10),
        sit_up_mnt: parseInt(formData.sit_up_mnt || 0, 10),
        squad_mnt: parseInt(formData.squad_mnt || 0, 10),
        tahan_napas_detik: parseInt(formData.tahan_napas_detik || 0, 10),
        tanggal_pengujian: formData.tanggal_pengujian,
      };

      if (formData.id) {
        await updateDoc(doc(db, "data_materi", formData.id), {
          ...cleanData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "data_materi"), {
          ...cleanData,
          user_uid: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      setShowFormModal(false);
      fetchDataMateri();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSubmitLoading(false);
      setTimeout(() => resetNotifications(), 3000);
    }
  };

  // 🔹 Kolom tabel
  const columns = useMemo(
    () => [
      { name: "Tanggal", selector: (row) => row.tanggal_pengujian, sortable: true },
      { 
        name: "Data Umum", 
        selector: (row) => row.id_data_umum ? (
            dataUmumList.find(d => d.id === row.id_data_umum)?.nama_lengkap || row.id_data_umum
        ) : "-",
      },
      { name: "IMT", selector: (row) => row.index_masa_tubuh, sortable: true },
      { name: "VO2Max", selector: (row) => row.vo2max, sortable: true },
      {
        name: "Aksi",
        cell: (row) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleView(row)}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition"
              title="Lihat Detail"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition"
              title="Edit Data"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition"
              title="Hapus Data"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    // 🟢 PERBAIKAN: Masukkan handleView, handleEdit, handleDelete, dan dataUmumList
    [handleView, handleEdit, handleDelete, dataUmumList] 
  );

  if (loading) return <FullScreenLoader />;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <SidebarUser />
      </div>

      <div className="lg:ml-64 mt-14 p-8 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Data Hasil Tes Kebugaran</h1>

          <button
            onClick={handleAdd}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <Plus size={18} className="mr-1" /> Tambah Data
          </button>
        </div>

        {/* Notifikasi */}
        {success && (
          <div className="text-green-600 bg-green-100 p-3 rounded flex items-center mb-4">
            <CheckCircle className="mr-2" size={20} /> Operasi berhasil!
          </div>
        )}
        {error && (
          <div className="text-red-600 bg-red-100 p-3 rounded flex items-center mb-4">
            <XCircle className="mr-2" size={20} /> Terjadi kesalahan saat menyimpan data.
          </div>
        )}
        
        {/* Tabel Data */}
        <DataTable
          columns={columns}
          data={dataMateri}
          pagination
          highlightOnHover
          noDataComponent="Belum ada data hasil tes kebugaran."
          className="shadow-lg rounded-lg"
        />

        {/* Modal Form Tambah/Edit */}
        {showFormModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                onClick={() => setShowFormModal(false)}
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                {formData.id ? "Edit Data" : "Tambah Data"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* 🔹 Select Data Umum (Dropdown) */}
                <label className="block text-sm font-medium text-gray-700">
                  Pilih Data Umum (Terkait Materi)
                </label>
                <select
                  name="id_data_umum"
                  value={formData.id_data_umum}
                  onChange={handleChange}
                  className="border p-2 w-full rounded"
                  disabled={dataUmumLoading}
                >
                  {dataUmumLoading ? (
                    <option value="">Memuat Data Umum...</option>
                  ) : (
                    <option value="">-- Pilih Data Umum (Opsional) --</option>
                  )}
                  {!dataUmumLoading && dataUmumList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama_lengkap || item.id}
                    </option>
                  ))}
                </select>

                {/* Input lainnya */}
                {[
                  { name: "index_masa_tubuh", label: "Index Massa Tubuh (IMT)", step: "0.01" },
                  { name: "kelenturan", label: "Kelenturan (cm)", step: "0.01" },
                  { name: "vo2max", label: "VO2Max (mL/kg.min)", step: "0.01" },
                  { name: "push_up_mnt", label: "Push Up (jumlah)", step: "1" },
                  { name: "sit_up_mnt", label: "Sit Up (jumlah)", step: "1" },
                  { name: "squad_mnt", label: "Squat (jumlah)", step: "1" },
                  { name: "tahan_napas_detik", label: "Tahan Napas (detik)", step: "1" },
                ].map((f) => (
                  <input
                    key={f.name}
                    type="number"
                    step={f.step}
                    name={f.name}
                    placeholder={f.label}
                    value={formData[f.name]}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                ))}

                {/* Input Tanggal */}
                <label className="block text-sm font-medium text-gray-700">
                  Tanggal Pengujian
                </label>
                <input
                  type="date"
                  name="tanggal_pengujian"
                  value={formData.tanggal_pengujian}
                  onChange={handleChange}
                  className="border p-2 w-full rounded"
                  required
                />

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Data"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detail (Info) */}
        {showDetailModal && selectedData && (
          <DetailModal
            data={selectedData}
            onClose={() => setShowDetailModal(false)}
          />
        )}

        {/* Modal Hapus (ConfirmModal) */}
        {showDeleteModal && selectedData && (
          <ConfirmModal
            title="Hapus Data"
            message={`Apakah Anda yakin ingin menghapus hasil tes kebugaran pada tanggal ${selectedData.tanggal_pengujian}? Data yang dihapus tidak dapat dikembalikan.`}
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DataMateriUser;