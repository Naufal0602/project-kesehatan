import React, { useEffect, useState, useMemo, useCallback } from "react";
import SidebarUser from "../../../components/sidebar_user";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../services/firebaseConfig";
import DataTable from "react-data-table-component";
import { Eye, FileText } from "lucide-react";
import FullScreenLoader from "../../../components/FullScreenLoader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DetailModal = ({ data, onClose }) => {
  const fields = [
    { label: "Tanggal Pengujian", key: "tanggal_pengujian" },
    { label: "IMT (Index Masa Tubuh)", key: "index_masa_tubuh" },
    { label: "Kelenturan (cm)", key: "kelenturan" },
    { label: "VO2Max (mL/kg.min)", key: "vo2max" },
    { label: "Push Up (kali)", key: "push_up_mnt" },
    { label: "Sit Up (kali)", key: "sit_up_mnt" },
    { label: "Squat (kali)", key: "squad_mnt" },
    { label: "Tahan Napas (detik)", key: "tahan_napas_detik" },
  ];

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-md relative shadow-2xl">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          Detail Hasil Pengujian
        </h2>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">{f.label}:</span>
              <span className="font-semibold text-gray-800">
                {data[f.key] ?? "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PrintModal = ({
  isOpen,
  onClose,
  onPrintAll,
  onPrintRange,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  printing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-fadeIn">
        <h3 className="text-xl font-bold mb-4">Opsi Print</h3>

        {/* Print Semua */}
        <button
          onClick={onPrintAll}
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-900 flex items-center justify-center mb-4"
          disabled={printing}
        >
          <FileText size={18} className="mr-2" />
          {printing ? "Mencetak..." : "Print Semua Data"}
        </button>

        <hr className="my-4" />

        {/* Print Berdasarkan Tanggal */}
        <p className="font-medium mb-2">Print Berdasarkan Tanggal:</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Dari</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border p-2 rounded w-40"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Sampai</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border p-2 rounded w-40"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onPrintRange}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={printing}
          >
            {printing ? "Mencetak..." : "Print Range"}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={printing}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

const DataMateriUser = () => {
  const [loading, setLoading] = useState(true);
  const [dataMateri, setDataMateri] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  // filter tanggal di halaman
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // modal print
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printing, setPrinting] = useState(false);

  const user = auth.currentUser;

  // fetch semua data_materi untuk peserta yang login (banyak dokumen)
  const fetchDataMateri = useCallback(async () => {
    setLoading(true);
    try {
      if (!user || !user.uid) {
        setDataMateri([]);
        return;
      }
      const q = query(
        collection(db, "data_materi"),
        where("peserta_id", "==", user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // sort by tanggal (descending)
      list.sort((a, b) => {
        const da = new Date(a.tanggal_pengujian).getTime() || 0;
        const db2 = new Date(b.tanggal_pengujian).getTime() || 0;
        return db2 - da;
      });
      setDataMateri(list);
    } catch (err) {
      console.error("fetchDataMateri:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDataMateri();
  }, [fetchDataMateri]);

  // helper konversi tanggal string ke Date (mengasumsikan format 'YYYY-MM-DD')
  const toDate = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // filtered data berdasarkan dateFrom/dateTo pada tampilan tabel
  const filteredData = useMemo(() => {
    if (!dateFrom && !dateTo) return dataMateri;
    const from = dateFrom ? toDate(dateFrom) : null;
    const to = dateTo ? toDate(dateTo) : null;
    return dataMateri.filter((r) => {
      const td = toDate(r.tanggal_pengujian);
      if (!td) return false;
      if (from && to) {
        return td >= from && td <= to;
      } else if (from) {
        return td >= from;
      } else if (to) {
        return td <= to;
      }
      return true;
    });
  }, [dataMateri, dateFrom, dateTo]);

  const handleView = useCallback((row) => {
    setSelectedData(row);
    setShowDetailModal(true);
  }, []);

  // ambil nama peserta dari users/{user.uid}
  const fetchUserName = async (uid) => {
    try {
      if (!uid) return null;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      return data?.nama || null; // sesuai field 'nama' di Firestore
    } catch (err) {
      console.error("fetchUserName:", err);
      return null;
    }
  };

  const generatePDF = useCallback(
    async (rows) => {
      setPrinting(true);

      try {
        const docPdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });

        const userName = await fetchUserName(user.uid);
        const today = new Date();

        const tanggalCetak = today.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        docPdf.setFontSize(16);
        docPdf.text("Data Peserta", 40, 40);

        docPdf.setFontSize(11);
        docPdf.text(`Nama Peserta: ${userName}`, 40, 60);
        docPdf.text(`Tanggal Cetak: ${tanggalCetak}`, 40, 75);

        // Table
        autoTable(docPdf, {
          head: [
            [
              "No",
              "Tanggal",
              "IMT",
              "Kelenturan",
              "VO2Max",
              "Push Up",
              "Sit Up",
              "Squat",
              "Tahan Napas",
            ],
          ],
          body: rows.map((r, idx) => [
            idx + 1,
            r.tanggal_pengujian,
            r.index_masa_tubuh,
            r.kelenturan,
            r.vo2max,
            r.push_up_mnt,
            r.sit_up_mnt,
            r.squad_mnt,
            r.tahan_napas_detik,
          ]),
          startY: 100,
          styles: { fontSize: 10 },
        });

        // Nama file
        const fileDate = today.toISOString().slice(0, 19).replace(/:/g, "-");

        docPdf.save(`hasil_tes_${userName}_${fileDate}.pdf`);
      } finally {
        setPrinting(false);
      }
    },
    [user]
  );

  // handler print all / print range
  const handlePrintAll = useCallback(async () => {
    setShowPrintModal(false);
    await generatePDF(dataMateri);
  }, [dataMateri, generatePDF]);

  const handlePrintRange = useCallback(async () => {
    setShowPrintModal(false);
    const from = dateFrom ? toDate(dateFrom) : null;
    const to = dateTo ? toDate(dateTo) : null;

    const rows = dataMateri.filter((r) => {
      const td = toDate(r.tanggal_pengujian);
      if (!td) return false;
      if (from && to) return td >= from && td <= to;
      if (from) return td >= from;
      if (to) return td <= to;
      return true;
    });

    await generatePDF(rows);
  }, [dataMateri, dateFrom, dateTo, generatePDF]);

  const columns = useMemo(
    () => [
      { name: "Tanggal", selector: (r) => r.tanggal_pengujian, sortable: true },
      { name: "IMT", selector: (r) => r.index_masa_tubuh, sortable: true },
      { name: "VO2Max", selector: (r) => r.vo2max, sortable: true },
      {
        name: "Aksi",
        cell: (row) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleView(row)}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition"
              title="Lihat Detail"
            >
              <Eye size={14} />
            </button>
          </div>
        ),
      },
    ],
    [handleView]
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
        </div>

        {/* Filter Tanggal di Halaman */}
        <div className="bg-white p-4 rounded shadow mb-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Dari */}
          <div className="flex flex-col w-full md:w-auto">
            <label className="text-sm font-medium mb-1">Dari:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Sampai */}
          <div className="flex flex-col w-full md:w-auto">
            <label className="text-sm font-medium mb-1">Sampai:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 md:flex-row md:ml-auto md:items-center w-full md:w-auto">
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="px-3 py-2 border rounded w-full md:w-auto"
            >
              Reset
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded w-full md:w-auto"
            >
              Print
            </button>
          </div>
        </div>

        {/* Tabel */}
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          highlightOnHover
          noDataComponent="Belum ada data hasil tes kebugaran."
          className="shadow-lg rounded-lg bg-white"
        />

        {/* Detail Modal */}
        {showDetailModal && selectedData && (
          <DetailModal
            data={selectedData}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedData(null);
            }}
          />
        )}

        {/* Print Modal */}
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onPrintAll={handlePrintAll}
          onPrintRange={handlePrintRange}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          printing={printing}
        />
      </div>
    </div>
  );
};

export default DataMateriUser;
