import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../../components/sidebar";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { db } from "../../../services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminDataPenyakit() {
  const [data, setData] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [selectedJenis, setSelectedJenis] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJenis, setExportJenis] = useState([]);

  // -------------------- PARSE BULAN (dari Firestore Timestamp) --------------------
  const parseBulanTimestamp = (ts) => {
    if (!ts || !ts.toDate) {
      return {
        raw: null,
        bulan: "-",
        month: "-",
        year: "-",
      };
    }

    const d = ts.toDate();
    const namaBulan = d.toLocaleString("id-ID", { month: "long" });

    return {
      raw: d,
      bulan: `${namaBulan} ${d.getFullYear()}`, // contoh: Februari 2025
      month: d.getMonth() + 1, // angka bulan untuk chart
      year: d.getFullYear(),
    };
  };

  // -------------------- Ambil semua data (jenis, user, penyakit) --------------------
  const fetchData = async () => {
    try {
      // Ambil data jenis penyakit
      const jenisSnapshot = await getDocs(collection(db, "jenis_penyakit"));
      const jenisMap = {};
      jenisSnapshot.forEach((doc) => {
        jenisMap[doc.id] = doc.data().nama_jenis;
      });
      const jenisOptions = Object.values(jenisMap).map((nama) => ({
        value: nama,
        label: nama,
      }));
      setJenisList(jenisOptions);

      // Ambil data user
      const userSnapshot = await getDocs(collection(db, "users"));
      const userMap = {};
      userSnapshot.forEach((doc) => {
        userMap[doc.id] = doc.data().nama || doc.data().email || "-";
      });

      // Ambil data penyakit
      const penyakitSnapshot = await getDocs(collection(db, "data_penyakit"));
      const list = penyakitSnapshot.docs.map((doc) => {
        const d = doc.data();

        const bulanFixed = parseBulanTimestamp(d.bulan);

        return {
          id: doc.id,
          ...d,

          nama_user: userMap[d.user_id] || "Tidak diketahui",
          nama_jenis_penyakit: jenisMap[d.id_jenis_penyakit] || "-",

          // TAMPILAN UNTUK DATATABLE
          bulan_tampil: bulanFixed.bulan, // "Februari 2025"

          // RAW UNTUK CHART / SORT
          bulan_raw: bulanFixed.raw,
          bulan_month: bulanFixed.month,
          bulan_year: bulanFixed.year,
        };
      });

      setData(list);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------- FILTER (Jenis Penyakit + Pencarian) --------------------
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const cocokJenis =
        selectedJenis.length === 0 ||
        selectedJenis.some((j) => j.value === item.nama_jenis_penyakit);

      const cari = search.toLowerCase();
      const cocokCari =
        item.nama_user?.toLowerCase().includes(cari) ||
        item.nama_penyakit?.toLowerCase().includes(cari);

      return cocokJenis && cocokCari;
    });
  }, [data, selectedJenis, search]);

  // -------------------- KOLUMN TABEL --------------------
  const columns = [
    { name: "Nama User", selector: (row) => row.nama_user, sortable: true },
    { name: "Jenis Penyakit", selector: (row) => row.nama_jenis_penyakit },
    { name: "Nama Penyakit", selector: (row) => row.nama_penyakit },
    { name: "Hasil Lab", selector: (row) => row.hasil_lab },
    { name: "Status", selector: (row) => row.status },
    { name: "Bulan", selector: (row) => row.bulan_tampil }, // "Februari 2025"
  ];

  const generatePdf = (title, tableData) => {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(title, 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [
        [
          "No",
          "Nama User",
          "Jenis Penyakit",
          "Nama Penyakit",
          "Status",
          "Bulan",
        ],
      ],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: 255,
      },
    });

    doc.save(`${title}.pdf`);
  };

  const exportPdfAll = () => {
    const tableData = data.map((item, i) => [
      i + 1,
      item.nama_user,
      item.nama_jenis_penyakit,
      item.nama_penyakit,
      item.status,
      item.bulan_tampil,
    ]);

    generatePdf("Data Penyakit Semua User", tableData);
  };

  const exportPdfFiltered = () => {
    if (!fromDate || !toDate) {
      alert("Tanggal belum lengkap");
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59);

    const filtered = data.filter((item) => {
      // FILTER JENIS (PAKAI exportJenis)
      const cocokJenis =
        exportJenis.length === 0 ||
        exportJenis.some((j) => j.value === item.nama_jenis_penyakit);

      // FILTER TANGGAL
      const tgl = item.bulan_raw;
      const cocokTanggal = tgl && tgl >= from && tgl <= to;

      return cocokJenis && cocokTanggal;
    });

    if (filtered.length === 0) {
      alert("Data tidak ditemukan");
      return;
    }

    const tableData = filtered.map((item, i) => [
      i + 1,
      item.nama_user,
      item.nama_jenis_penyakit,
      item.nama_penyakit,
      item.status,
      item.bulan_tampil,
    ]);

    generatePdf("Data Penyakit Filter", tableData);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>

      <div className="lg:ml-64 mt-16 p-4 md:p-6 w-full overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:justify-between text-green-600 bg-white p-4 md:items-center mb-6 gap-4">
          <h1 className="text-2xl">Data Penyakit Semua User</h1>
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export PDF
            </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white w-full p-4 rounded-xl shadow mb-6 lg:justify-between">
          <div className="grid w-full md:grid-cols-2 lg:grid-cols-3 gap-4 lg:justify-between 2xl:justify-between">
            <div>
              <label className="font-medium block mb-1 text-gray-600">
                Filter Jenis Penyakit
              </label>
              <Select
                isMulti
                options={jenisList}
                value={selectedJenis}
                onChange={setSelectedJenis}
                placeholder="Pilih satu atau lebih jenis penyakit..."
              />
            </div>
            <div>
              <label className="font-medium block mb-1 text-gray-600">
                Cari Nama User / Penyakit
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama user atau penyakit..."
                className="w-full border-gray-300 rounded-md p-2 border focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
        </div>

        {/* TABEL */}
        <div className="bg-white p-4 rounded-xl shadow">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
            striped
            dense
            noDataComponent="Tidak ada data ditemukan."
          />
        </div>

        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-green-600 mb-4">
                Export Data Penyakit
              </h2>

              {/* EXPORT SEMUA */}
              <button
                onClick={() => {
                  exportPdfAll();
                  setShowExportModal(false);
                }}
                className="w-full mb-4 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Export Semua Data
              </button>

              <hr className="my-4" />

              {/* FILTER */}
              <h3 className="font-semibold mb-3 text-gray-700">
                Export Dengan Filter
              </h3>

              {/* TANGGAL */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-sm text-gray-600">Dari Tanggal</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
              {/* FILTER JENIS PENYAKIT (KHUSUS EXPORT) */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">
                  Filter Jenis Penyakit
                </label>
                <Select
                  isMulti
                  options={jenisList}
                  value={exportJenis}
                  onChange={setExportJenis}
                  placeholder="Pilih jenis penyakit untuk export..."
                />
              </div>

              {/* INFO FILTER JENIS */}
              <p className="text-sm text-gray-500 mb-3">
                * Filter jenis penyakit mengikuti pilihan filter di atas
              </p>

              {/* EXPORT FILTER */}
              <button
                onClick={() => {
                  exportPdfFiltered();
                  setShowExportModal(false);
                }}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Export Dengan Filter
              </button>

              {/* TUTUP */}
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full mt-4 bg-gray-300 py-2 rounded hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
