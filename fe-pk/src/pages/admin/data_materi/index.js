import React, { useEffect, useState, useMemo, useCallback } from "react";
import Sidebar from "../../../components/sidebar"; // ganti ke SidebarAdmin jika perlu
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
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
import Select from "react-select";

const initialFormData = {
  id: "",
  peserta_id: "",
  index_masa_tubuh: "",
  kelenturan: "",
  vo2max: "",
  push_up_mnt: "",
  sit_up_mnt: "",
  squad_mnt: "",
  tahan_napas_detik: "",
  tanggal_pengujian: "",
};

// --- Komponen Modal Detail ---
const DetailModal = ({ data, onClose }) => {
  const fields = [
    { label: "Peserta ID", key: "peserta_id" },
    { label: "Admin Input", key: "admin_nama" },
    { label: "Tanggal Pengujian", key: "tanggal_pengujian" },
    { label: "Index Massa Tubuh", key: "index_masa_tubuh" },
    { label: "Kelenturan (cm)", key: "kelenturan" },
    { label: "VO2Max", key: "vo2max" },
    { label: "Push Up (menit)", key: "push_up_mnt" },
    { label: "Sit Up (menit)", key: "sit_up_mnt" },
    { label: "Squat (menit)", key: "squad_mnt" },
    { label: "Tahan Napas (detik)", key: "tahan_napas_detik" },
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
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DataMateriAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [dataMateri, setDataMateri] = useState([]);
  const [pesertaList, setPesertaList] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const resetNotifications = useCallback(() => {
    setSuccess(false);
    setError(false);
  }, []);

  // --- Fetch data materi ---
  const fetchDataMateri = useCallback(async () => {
    setLoading(true);
    try {
      const q = collection(db, "data_materi");
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDataMateri(list);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Fetch daftar peserta ---
  const fetchPeserta = useCallback(async () => {
    try {
      const q = collection(db, "data_spesifik");
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPesertaList(list);
    } catch (err) {
      console.error("Gagal ambil data peserta:", err);
    }
  }, []);

  useEffect(() => {
    fetchDataMateri();
    fetchPeserta();
  }, [fetchDataMateri, fetchPeserta]);

  // --- ACTIONS ---
  const handleView = useCallback(
    (row) => {
      setSelectedData(row);
      setShowDetailModal(true);
      resetNotifications();
    },
    [resetNotifications]
  );

  const handleEdit = useCallback(
    (row) => {
      const stringified = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, String(v ?? "")])
      );
      setFormData(stringified);
      setShowFormModal(true);
      resetNotifications();
    },
    [resetNotifications]
  );

  const handleDelete = useCallback(
    (row) => {
      setConfirmData({
        title: "Hapus Data",
        message: `Yakin ingin menghapus data tanggal ${row.tanggal_pengujian}?`,
        onConfirm: async () => {
          try {
            setSubmitLoading(true);
            await deleteDoc(doc(db, "data_materi", row.id));
            setSuccess(true);
            fetchDataMateri();
          } catch (err) {
            console.error(err);
            setError(true);
          } finally {
            setSubmitLoading(false);
            setTimeout(() => resetNotifications(), 3000);
            setConfirmData(null);
          }
        },
      });
      resetNotifications();
    },
    [fetchDataMateri, resetNotifications]
  );

  const handleAdd = useCallback(() => {
    setFormData(initialFormData);
    setShowFormModal(true);
    resetNotifications();
  }, [resetNotifications]);

  // --- Handle input ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handle submit (add/update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    resetNotifications();

    try {
      let adminNama = "Tidak diketahui";
      const admin = auth.currentUser;

      // ambil nama admin dari koleksi users
      if (admin) {
        const adminRef = doc(db, "users", admin.uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          adminNama = adminSnap.data().nama || admin.displayName || "Admin";
        }
      }

      const cleanData = {
        peserta_id: formData.peserta_id,
        index_masa_tubuh: parseFloat(formData.index_masa_tubuh || 0),
        kelenturan: parseFloat(formData.kelenturan || 0),
        vo2max: parseFloat(formData.vo2max || 0),
        push_up_mnt: parseInt(formData.push_up_mnt || 0, 10),
        sit_up_mnt: parseInt(formData.sit_up_mnt || 0, 10),
        squad_mnt: parseInt(formData.squad_mnt || 0, 10),
        tahan_napas_detik: parseInt(formData.tahan_napas_detik || 0, 10),
        tanggal_pengujian: formData.tanggal_pengujian,
        admin_id: admin?.uid || "",
        admin_nama: adminNama,
      };

      if (formData.id) {
        await updateDoc(doc(db, "data_materi", formData.id), {
          ...cleanData,
          updated_at: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "data_materi"), {
          ...cleanData,
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

  const columns = useMemo(
    () => [
      {
        name: "Peserta",
        selector: (row) => {
          const peserta = pesertaList.find((p) => p.id === row.peserta_id);
          return peserta
            ? peserta.nama_lengkap || peserta.nama || "Tanpa Nama"
            : "-";
        },
        sortable: true,
      },
      {
        name: "Admin Input",
        selector: (row) => row.admin_nama || "-",
        sortable: true,
      },
      {
        name: "Tanggal",
        selector: (row) => row.tanggal_pengujian,
        sortable: true,
      },
      { name: "IMT", selector: (row) => row.index_masa_tubuh, sortable: true },
      { name: "VO2Max", selector: (row) => row.vo2max, sortable: true },
      {
        name: "Aksi",
        cell: (row) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleView(row)}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
        ignoreRowClick: true,
      },
    ],
    [handleView, handleEdit, handleDelete, pesertaList]
  );

  if (loading) return <FullScreenLoader />;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>

      <div className="lg:ml-64 mt-14 p-8 w-full">
        <div className="flex flex-col bg-white p-5 rounded-md sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-green-600 text-lg sm:text-xl font-bold">
            Daftar data materi
          </h2>

          <button
            onClick={handleAdd}
            className="bg-green-600 flex text-white px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-md hover:bg-green-700 transition duration-300"
          >
            <Plus size={18} className="mr-1" /> Tambah Data
          </button>
        </div>

        {success && (
          <div className="text-green-600 bg-green-100 p-3 rounded flex items-center mb-4">
            <CheckCircle className="mr-2" size={20} /> Operasi berhasil!
          </div>
        )}
        {error && (
          <div className="text-red-600 bg-red-100 p-3 rounded flex items-center mb-4">
            <XCircle className="mr-2" size={20} /> Terjadi kesalahan.
          </div>
        )}

        <DataTable
          columns={columns}
          data={dataMateri}
          pagination
          highlightOnHover
          noDataComponent="Belum ada data."
          className="shadow-lg rounded-lg"
          onRowDoubleClicked={() => {}}
        />

        {showFormModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Tombol close */}
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                onClick={() => setShowFormModal(false)}
              >
                <X size={20} />
              </button>

              <h2 className="text-lg font-semibold mb-4 border-b pb-2">
                {formData.id ? "Edit Data" : "Tambah Data"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 pb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Pilih Peserta
                </label>
                <Select
                  options={pesertaList.map((p) => ({
                    value: p.id,
                    label: p.nama || p.id,
                  }))}
                  value={
                    pesertaList.find((p) => p.id === formData.peserta_id)
                      ? {
                          value: formData.peserta_id,
                          label:
                            pesertaList.find(
                              (p) => p.id === formData.peserta_id
                            )?.nama || formData.peserta_id,
                        }
                      : null
                  }
                  onChange={(selected) =>
                    handleChange({
                      target: {
                        name: "peserta_id",
                        value: selected?.value || "",
                      },
                    })
                  }
                  placeholder="Cari atau pilih peserta..."
                  noOptionsMessage={() => "Pengguna tidak ditemukan"}
                  isClearable
                />
                {[
                  { name: "index_masa_tubuh", label: "Index Massa Tubuh" },
                  { name: "kelenturan", label: "Kelenturan (cm)" },
                  { name: "vo2max", label: "VO2Max" },
                  { name: "push_up_mnt", label: "Push Up (menit)" },
                  { name: "sit_up_mnt", label: "Sit Up (menit)" },
                  { name: "squad_mnt", label: "Squat (menit)" },
                  { name: "tahan_napas_detik", label: "Tahan Napas (detik)" },
                ].map((f) => (
                  <input
                    key={f.name}
                    type="number"
                    name={f.name}
                    placeholder={f.label}
                    value={formData[f.name]}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                ))}
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
      </div>

      {/* Modal Detail */}
      {showDetailModal && selectedData && (
        <DetailModal
          data={selectedData}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {confirmData && (
        <ConfirmModal
          title={confirmData.title}
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </div>
  );
};

export default DataMateriAdmin;
