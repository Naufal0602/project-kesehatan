import React, { useState, useEffect } from "react";
import SidebarUser from "../../../components/sidebar_user";
import DataTable from "react-data-table-component";
import { db } from "../../../services/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Loader2, Search, Info, Eye, Download, X } from "lucide-react";

const UserDataUmum = () => {
  const [dataUmum, setDataUmum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Ambil data dari Firestore
  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "data_umum"),
        orderBy("created_at", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate(),
      }));
      setDataUmum(list);
      setFilteredData(list);
    } catch (err) {
      console.error("Gagal memuat data umum:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Filter berdasarkan tanggal
  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFilteredData(dataUmum);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = dataUmum.filter((item) => {
      const createdAt = new Date(item.created_at);
      return createdAt >= start && createdAt <= end;
    });
    setFilteredData(filtered);
  };

  // 🔹 Tampilkan modal detail data
  const handleShowDetail = (row) => {
    setSelectedData(row);
    setShowModal(true);
  };

  const getFileExtension = (url) => {
    const match = url.match(/\.(\w+)(\?|$)/);
    return match ? match[1].toLowerCase() : "";
  };

  // 🔹 Fungsi download file dengan ekstensi benar
  const handleDownload = async (file) => {
    if (!file?.file_url) {
      alert("File tidak ditemukan.");
      return;
    }

    try {
      const ext = getFileExtension(file.file_url) || "bin";
      const namaFile = file.nama_file?.includes(".")
        ? file.nama_file
        : `${file.nama_file || "file_unduhan"}.${ext}`;

      // Ambil file blob dari URL (agar bisa pakai ekstensi benar)
      const response = await fetch(file.file_url);
      const blob = await response.blob();

      // Buat link untuk unduhan manual
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = namaFile;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error("Gagal mengunduh file:", err);
      alert("Terjadi kesalahan saat mengunduh file.");
    }
  };

  // 🔹 Kolom tabel
  const columns = [
    { name: "Materi", selector: (row) => row.materi, sortable: true },
    { name: "Kategori", selector: (row) => row.kategori },
    { name: "Keterangan", selector: (row) => row.keterangan },
    {
      name: "Tanggal Dibuat",
      selector: (row) =>
        row.created_at
          ? row.created_at.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
      sortable: true,
    },
    {
      name: "Aksi",
      cell: (row) => (
        <button
          onClick={() => handleShowDetail(row)}
          className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1"
        >
          <Info size={16} /> Info
        </button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <SidebarUser />
      </div>

      <div className="lg:ml-64 mt-14 p-6 w-full">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold mb-4 md:mb-0 text-green-600">Data Umum</h1>

            {/* 🔹 Filter tanggal */}
            <div className="flex flex-wrap sm:justify-center items-center gap-2">
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-gray-600">sampai</span>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button
                onClick={handleFilter}
                className="bg-blue-500 text-white px-3 py-2 justify-left rounded-lg flex items-center gap-1 hover:bg-blue-600"
              >
                <Search size={16} /> Filter
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : filteredData.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              Tidak ada data ditemukan.
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

      {/* 🔹 Modal Detail */}
      {showModal && selectedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg relative overflow-y-auto max-h-[80vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">📘 Detail Data Umum</h2>
            <div className="space-y-2 text-left">
              <p>
                <strong>Materi:</strong> {selectedData.materi}
              </p>
              <p>
                <strong>Kategori:</strong> {selectedData.kategori}
              </p>
              <p>
                <strong>Keterangan:</strong> {selectedData.keterangan}
              </p>
              {selectedData.data && (
                <p>
                  <strong>Data:</strong> {selectedData.data}
                </p>
              )}
              <p>
                <strong>Tanggal Dibuat:</strong>{" "}
                {selectedData.created_at
                  ? selectedData.created_at.toLocaleString("id-ID")
                  : "-"}
              </p>

              {/* 🔹 Tampilkan file */}
              {selectedData.files && selectedData.files.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">📂 File Terkait:</h3>
                  <div className="space-y-3">
                    {selectedData.files.map((file, index) => {
                      const ext = getFileExtension(file.file_url);
                      return (
                        <div
                          key={index}
                          className="border rounded-lg bg-gray-50 p-3"
                        >
                          <p className="font-medium text-sm mb-2">
                            {file.nama_file}
                          </p>

                          {/* 🖼️ Gambar */}
                          {["jpg", "jpeg", "png", "webp"].includes(ext) && (
                            <img
                              src={file.file_url}
                              alt={file.nama_file}
                              className="rounded mb-3 max-h-64 mx-auto"
                            />
                          )}

                          {/* 📄 PDF */}
                          {ext === "pdf" && (
                            <iframe
                              src={file.file_url}
                              className="w-full h-72 rounded mb-3 border"
                              title="PDF Viewer"
                            ></iframe>
                          )}

                          {/* 📘 File Office / Lain */}
                          {[
                            "doc",
                            "docx",
                            "xls",
                            "xlsx",
                            "zip",
                            "rar",
                          ].includes(ext) && (
                            <div className="flex items-center gap-2 text-gray-700 mb-3">
                              <Eye size={16} />
                              <span>
                                Tidak dapat ditampilkan di sini, unduh untuk
                                melihat.
                              </span>
                            </div>
                          )}

                          {/* Tombol aksi */}
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleDownload(file)}
                              className="bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-600"
                            >
                              <Download size={14} /> Unduh
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDataUmum;
