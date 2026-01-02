import React, { useEffect, useState, useMemo, useCallback } from "react";
import Sidebar from "../../../components/sidebar";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
const isAndroidWebView = () => {
  return typeof window !== "undefined" && window.AndroidInterface;
};

// --- Komponen Modal Detail ---
const DetailModal = ({ data, onClose }) => {
  const fields = [
    { label: "Nama Peserta", key: "peserta_nama" },
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
  const [usersList, setUsersList] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const fetchUsers = useCallback(async () => {
    try {
      const q = collection(db, "users");
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsersList(list);
    } catch (err) {
      console.error("Gagal ambil users:", err);
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
    fetchUsers();
  }, [fetchDataMateri, fetchPeserta, fetchUsers]);

  // --- ACTIONS ---
  const handleView = useCallback(
    (row) => {
      const peserta = pesertaList.find((p) => p.id === row.peserta_id);

      setSelectedData({
        ...row,
        peserta_nama: peserta?.nama_lengkap || peserta?.nama || "Tanpa Nama",
      });

      setShowDetailModal(true);
      resetNotifications();
    },
    [pesertaList, resetNotifications]
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
      const peserta = pesertaList.find((p) => p.id === row.peserta_id);
      const namaPeserta =
        peserta?.nama_lengkap || peserta?.nama || "peserta ini";

      setConfirmData({
        title: "Hapus Data",
        message: `Yakin ingin menghapus data milik ${namaPeserta} pada tanggal ${row.tanggal_pengujian}?`,
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
            setConfirmData(null);
          }
        },
      });
    },
    [pesertaList, fetchDataMateri]
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
          <div
            className="flex space-x-2 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleView(row)}
              className="bg-green-500 text-white p-1 rounded"
            >
              <Eye size={16} />
            </button>

            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="bg-blue-500 text-white p-1 rounded"
            >
              <Edit size={16} />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="bg-red-500 hover:bg-red-800 text-white p-1 rounded"
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

  const pesertaUserOnly = pesertaList.filter((p) => {
    const user = usersList.find((u) => u.id === p.id);
    return user?.role === "user";
  });

  const filteredData = useMemo(() => {
    return dataMateri.filter((item) => {
      const peserta = pesertaList.find((p) => p.id === item.peserta_id);
      const namaPeserta = peserta?.nama_lengkap || peserta?.nama || "";

      return (
        namaPeserta.toLowerCase().includes(filterText.toLowerCase()) ||
        item.admin_nama?.toLowerCase().includes(filterText.toLowerCase()) ||
        item.tanggal_pengujian?.includes(filterText)
      );
    });
  }, [filterText, dataMateri, pesertaList]);

  const generatePDF = (data, title = "Laporan Data Materi") => {
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(14);
    doc.text(title, 14, 15);

    const tableData = data.map((row, index) => {
      const peserta = pesertaList.find((p) => p.id === row.peserta_id);
      const namaPeserta = peserta?.nama_lengkap || peserta?.nama || "-";

      return [
        index + 1,
        namaPeserta,
        row.admin_nama || "-",
        row.tanggal_pengujian || "-",
        row.index_masa_tubuh ?? "-",
        row.kelenturan ?? "-",
        row.vo2max ?? "-",
        row.push_up_mnt ?? "-",
        row.sit_up_mnt ?? "-",
        row.squad_mnt ?? "-",
        row.tahan_napas_detik ?? "-",
      ];
    });

    autoTable(doc, {
      startY: 25,
      head: [
        [
          "No",
          "Nama Peserta",
          "Admin Input",
          "Tanggal",
          "IMT",
          "Kelenturan",
          "VO2Max",
          "Push Up/mnt",
          "Sit Up/mnt",
          "Squat/mnt",
          "Tahan Napas/dtk",
        ],
      ],
      body: tableData,
      styles: { fontSize: 9, halign: "center" },
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    });

    const today = new Date().toISOString().split("T")[0];
    const fileName = `laporan-materi-${today}.pdf`;

    // 🔥 KHUSUS ANDROID WEBVIEW
    if (isAndroidWebView()) {
      const base64 = doc.output("datauristring");
      window.AndroidInterface.savePDF(base64, fileName);
    } else {
      // 🌐 Browser normal
      doc.save(fileName);
    }
  };

  const exportAllData = () => {
    generatePDF(dataMateri, "Laporan Data Materi");
    setShowExportModal(false);
  };

  const exportByDate = () => {
    if (!fromDate || !toDate) {
      alert("Pilih tanggal dari dan sampai");
      return;
    }

    const filtered = dataMateri.filter((item) => {
      return (
        item.tanggal_pengujian >= fromDate && item.tanggal_pengujian <= toDate
      );
    });

    generatePDF(filtered, `Laporan Data Materi (${fromDate} s/d ${toDate})`);

    setShowExportModal(false);
  };

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
            onClick={() => setShowExportModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Export PDF
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
        <div className="bg-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <input
              type="text"
              placeholder="Cari peserta / admin / tanggal..."
              className="border p-2 rounded mb-4 w-full sm:w-1/3"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <button
              onClick={handleAdd}
              className="bg-green-600 flex text-white px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-md hover:bg-green-700 transition duration-300"
            >
              <Plus size={18} className="mr-1" /> Tambah Data
            </button>
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
            noDataComponent="Belum ada data."
            className="shadow-lg rounded-lg"
            pointerOnHover
          />
        </div>

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
                  options={pesertaUserOnly.map((p) => ({
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
      {confirmData && (
        <ConfirmModal
          show={true}
          title={confirmData.title}
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}
      {/* Modal Detail */}
      {showDetailModal && selectedData && (
        <DetailModal
          data={selectedData}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Export PDF</h2>

            <button
              onClick={exportAllData}
              className="w-full bg-green-600 text-white py-2 rounded mb-4 hover:bg-green-700"
            >
              Export Semua Data
            </button>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">
                Export Berdasarkan Tanggal
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>

              <button
                onClick={exportByDate}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Export Berdasarkan Tanggal
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="mt-4 w-full text-gray-500"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataMateriAdmin;
