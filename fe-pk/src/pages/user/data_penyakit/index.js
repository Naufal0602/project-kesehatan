import React, { useEffect, useState, useCallback } from "react";
import SidebarUser from "../../../components/sidebar_user";
import CreatableSelect from "react-select/creatable";
import DataTable from "react-data-table-component";
import { db, auth } from "../../../services/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import FullScreenLoader from "../../../components/FullScreenLoader";
import { Trash2, Pencil } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



export default function UserDataPenyakit() {
  const [user, setUser] = useState(null);
  const [jenisList, setJenisList] = useState([]);
  const [selectedJenis, setSelectedJenis] = useState(null);
  const [namaPenyakit, setNamaPenyakit] = useState("");
  const [tips, setTips] = useState("");
  const [hasilLab, setHasilLab] = useState("");
  const [bulan, setBulan] = useState("");
  const [status, setStatus] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [dataPenyakit, setDataPenyakit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(null); // 0 - 11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); 

  // modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  // 🔹 Dengarkan perubahan auth user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Ambil daftar jenis penyakit
  useEffect(() => {
    const fetchJenis = async () => {
      const querySnapshot = await getDocs(collection(db, "jenis_penyakit"));
      const data = querySnapshot.docs.map((doc) => ({
        value: doc.id,
        label: doc.data().nama_jenis,
        tips: doc.data().tips,
      }));
      setJenisList(data);
    };
    fetchJenis();
  }, []);

  // 🔹 Ambil data penyakit
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const jenisSnapshot = await getDocs(collection(db, "jenis_penyakit"));
      const jenisMap = {};
      jenisSnapshot.forEach((docItem) => {
        jenisMap[docItem.id] = docItem.data().nama_jenis;
      });

      const q = query(
        collection(db, "data_penyakit"),
        where("user_id", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((docItem) => {
        const data = docItem.data();
        const namaJenis = jenisMap[data.id_jenis_penyakit] || "-";
        return { id: docItem.id, ...data, nama_jenis_penyakit: namaJenis };
      });
      setDataPenyakit(list);
    } catch (error) {
      console.error("Gagal mengambil data penyakit:", error);
    } finally {
      setLoading(false);
    }
  }, [user]); // ✅ dependensi aman

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // 🔹 Tentukan status otomatis
  const tentukanStatus = (jenis, hasil) => {
    if (!jenis || hasil === "") return "";
    const val = parseFloat(hasil);

    if (jenis.label.toLowerCase().includes("kolesterol")) {
      if (val < 100) return "Optimal";
      if (val <= 129) return "Dekat Optimal / Di Atas Optimal";
      if (val <= 159) return "Garis Batas Tinggi";
      if (val <= 189) return "Tinggi";
      return "Sangat Tinggi";
    }

    if (jenis.label.toLowerCase().includes("gula darah puasa")) {
      if (val < 100) return "Normal";
      if (val >= 100 && val <= 125) return "Prediabetes";
      if (val >= 126) return "Diabetes";
    } else if (
      jenis.label.toLowerCase().includes("gula darah") ||
      jenis.label.toLowerCase().includes("gula")
    ) {
      if (val < 140) return "Normal";
      if (val >= 140 && val <= 199) return "Prediabetes";
      if (val >= 200) return "Diabetes";
    }

    if (jenis.label.toLowerCase().includes("tekanan darah")) {
      if (val < 120) return "Normal";
      if (val <= 139) return "Hipertensi";
      return "Tinggi";
    }

    return "Perlu Konsultasi";
  };

  // 🔹 Tambah atau pilih jenis
  const handleChange = async (newValue) => {
    if (!newValue) return;

    // Jika memilih opsi yang sudah ada
    if (!newValue.__isNew__) {
      setSelectedJenis(newValue);
      setTips(newValue.tips || "");
      if (hasilLab) setStatus(tentukanStatus(newValue, hasilLab));
    }
    // Jika mengetik jenis penyakit baru
    else {
      const newDoc = await addDoc(collection(db, "jenis_penyakit"), {
        nama_jenis: newValue.label,
        obat: [""], // biar langsung muncul di Firestore
        antisipasi: [""],
        created_at: new Date(),
        updated_at: new Date(),
      });

      const newOption = { value: newDoc.id, label: newValue.label, tips: "" };
      setJenisList((prev) => [...prev, newOption]);
      setSelectedJenis(newOption);
      setTips("");
    }
  };

  // 🔹 Update status otomatis
  useEffect(() => {
    if (selectedJenis && hasilLab !== "") {
      setStatus(tentukanStatus(selectedJenis, hasilLab));
    }
  }, [hasilLab, selectedJenis]);

  // 🔹 Tambah data
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJenis || !hasilLab || !bulan || !namaPenyakit) {
      alert("Harap isi semua field terlebih dahulu.");
      return;
    }
    try {
      setLoadingStatus("loading");
      await addDoc(collection(db, "data_penyakit"), {
        user_id: user?.uid || "",
        id_jenis_penyakit: selectedJenis.value,
        nama_penyakit: namaPenyakit,
        hasil_lab: parseFloat(hasilLab),
        bulan,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      });
      setLoadingStatus("success");
      setShowAddModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Gagal menyimpan data penyakit:", error);
      setLoadingStatus("error");
    }
  };

  // 🔹 Edit data
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingStatus("loading");
      const ref = doc(db, "data_penyakit", selectedData.id);
      await updateDoc(ref, {
        id_jenis_penyakit: selectedJenis.value,
        nama_penyakit: namaPenyakit,
        hasil_lab: parseFloat(hasilLab),
        bulan,
        status,
        updated_at: new Date(),
      });
      setLoadingStatus("success");
      setShowEditModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Gagal mengupdate data:", error);
      setLoadingStatus("error");
    }
  };

  // 🔹 Hapus data
  const handleDelete = async () => {
    try {
      setLoadingStatus("loading");
      await deleteDoc(doc(db, "data_penyakit", selectedData.id));
      setLoadingStatus("success");
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus data:", error);
      setLoadingStatus("error");
    }
  };

  const resetForm = () => {
    setSelectedJenis(null);
    setNamaPenyakit("");
    setHasilLab("");
    setBulan("");
    setStatus("");
    setTips("");
  };

  // 🔹 Kolom tabel
  const columns = [
    {
      name: "Nama Penyakit",
      selector: (row) => row.nama_penyakit,
      sortable: true,
    },
    {
      name: "Jenis",
      selector: (row) => row.nama_jenis_penyakit,
      sortable: true,
    },
    { name: "Hasil Lab", selector: (row) => row.hasil_lab, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    {
      name: "Bulan",
      selector: (row) =>
        new Date(row.bulan.seconds * 1000).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
      sortable: true,
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => {
              setSelectedData(row);
              setSelectedJenis(
                jenisList.find((j) => j.label === row.nama_jenis_penyakit) ||
                  null
              );
              setNamaPenyakit(row.nama_penyakit);
              setHasilLab(row.hasil_lab);
              setBulan(new Date(row.bulan.seconds * 1000));
              setStatus(row.status);
              setShowEditModal(true);
            }}
            className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white 
                      px-2 py-1 rounded text-xs sm:text-sm transition-all duration-200 
                      active:scale-95"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            onClick={() => {
              setSelectedData(row);
              setShowDeleteModal(true);
            }}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white 
                      px-2 py-1 rounded text-xs sm:text-sm transition-all duration-200 
                      active:scale-95"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      ),
    },
  ];

  const BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const filteredData = dataPenyakit.filter((item) => {
    const date = new Date(item.bulan.seconds * 1000);

    const matchMonth =
      selectedMonth === null || date.getMonth() === selectedMonth;

    const matchYear =
      selectedYear === null || date.getFullYear() === selectedYear;

    const keyword = search.toLowerCase();
    const matchSearch =
      item.nama_penyakit.toLowerCase().includes(keyword) ||
      item.nama_jenis_penyakit.toLowerCase().includes(keyword);

    return matchMonth && matchYear && matchSearch;
  });

  const handleExportPDF = () => {
  if (filteredData.length === 0) {
    alert("Tidak ada data untuk diexport");
    return;
  }

  const docPdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const today = new Date();
  const tanggalCetak = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  docPdf.setFontSize(16);
  docPdf.text("LAPORAN DATA PENYAKIT", 40, 40);

  docPdf.setFontSize(11);
  docPdf.text(`Tahun: ${selectedYear}`, 40, 60);
  docPdf.text(`Tanggal Cetak: ${tanggalCetak}`, 40, 75);

  autoTable(docPdf, {
    startY: 100,
    head: [[
      "No",
      "Nama Penyakit",
      "Jenis",
      "Hasil Lab",
      "Status",
      "Bulan"
    ]],
    body: filteredData.map((row, i) => [
      i + 1,
      row.nama_penyakit,
      row.nama_jenis_penyakit,
      row.hasil_lab,
      row.status,
      new Date(row.bulan.seconds * 1000).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
  });

  docPdf.save(`laporan_data_penyakit_${selectedYear}.pdf`);
};


  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <SidebarUser />
      </div>

      <div className="lg:ml-64 mt-14 p-8 w-full">
        {loadingStatus && (
          <FullScreenLoader
            status={loadingStatus}
            message={
              loadingStatus === "loading"
                ? "Memproses..."
                : loadingStatus === "success"
                ? "Berhasil!"
                : "Terjadi kesalahan!"
            }
          />
        )}

        {/* Header */}
        <div className="flex flex-col bg-white p-5 rounded-md sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-green-600 text-lg sm:text-xl font-bold">
            Riwayat Data Penyakit
          </h2>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            + Tambah Data
          </button>
        </div>
        <div className="bg-white p-5">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            {/* Filter Bulan */}
            <select
              value={selectedMonth ?? ""}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Semua Bulan</option>
              {BULAN.map((b, i) => (
                <option key={i} value={i}>
                  {b}
                </option>
              ))}
            </select>

            <DatePicker
              selected={new Date(selectedYear, 0, 1)}
              onChange={(date) => setSelectedYear(date.getFullYear())}
              showYearPicker
              dateFormat="yyyy"
              className="border px-4 py-2 rounded-lg w-full md:w-auto"
              placeholderText="Pilih Tahun"
            />

            {/* Search */}
            <input
              type="text"
              placeholder="Cari nama / jenis penyakit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg w-full md:w-1/3"
            />

            <button
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              📄 Export PDF
            </button>
          </div>

          {/* Tabel */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            {loading ? (
              <p className="text-center text-gray-500 py-10">Memuat data...</p>
            ) : dataPenyakit.length === 0 ? (
              <p className="text-center text-gray-500 py-10">
                Belum ada data penyakit.
              </p>
            ) : (
                <DataTable
                  columns={columns}
                  data={filteredData}
                  pagination
                  highlightOnHover
                  striped
                  responsive
                />
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Modal Tambah/Edit */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-3">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
            <button
              onClick={() => {
                showAddModal ? setShowAddModal(false) : setShowEditModal(false);
              }}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              {showAddModal ? "Tambah Data Penyakit" : "Edit Data Penyakit"}
            </h2>

            <form
              onSubmit={showAddModal ? handleSubmit : handleEditSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Jenis Penyakit:
                </label>
                <CreatableSelect
                  isClearable
                  onChange={handleChange}
                  options={jenisList}
                  value={selectedJenis}
                  placeholder="Ketik atau pilih jenis penyakit..."
                />
                {tips && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 mt-3 rounded">
                    <strong>Tips:</strong> {tips}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Nama Penyakit:
                </label>
                <input
                  type="text"
                  value={namaPenyakit}
                  onChange={(e) => setNamaPenyakit(e.target.value)}
                  className="border p-2 w-full rounded"
                  placeholder="Masukkan nama penyakit..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Hasil Lab:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hasilLab}
                  onChange={(e) => setHasilLab(e.target.value)}
                  className="border p-2 w-full rounded"
                  placeholder="Masukkan hasil lab..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Bulan:
                </label>

                <DatePicker
                  selected={bulan}
                  onChange={(date) => setBulan(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  className="border p-2 w-full rounded"
                  placeholderText="Pilih bulan..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-gray-700">
                  Status (Otomatis):
                </label>
                <input
                  type="text"
                  value={status}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
              >
                {showAddModal ? "Simpan" : "Perbarui"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔹 Modal Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-4">Hapus Data?</h2>
            <p className="text-gray-600 mb-6">
              Apakah kamu yakin ingin menghapus data{" "}
              <strong>{selectedData.nama_penyakit}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
