// src/pages/admin/data_umum/DataUmumAdmin.js
import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../../components/sidebar";
import DataTable from "react-data-table-component";
import {
  Loader2,
  Trash2,
  Edit,
  Plus,
  FileUp,
  Info,
  File,
  X,
  Eye,
  Download,
} from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../../services/firebaseConfig";

/**
 * DataUmumAdmin
 * Versi lengkap: upload semua tipe file via /upload, simpan metadata resource_type & format,
 * preview gambar/pdf, download semua file dengan nama & ekstensi yang benar,
 * hapus file dengan mengirim public_id + resource_type ke /delete.
 */
const DataUmumAdmin = () => {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [filterText, setFilterText] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    materi: "",
    data: "",
    kategori: "",
    keterangan: "",
    files: [], // File objek (File API) untuk upload
  });

  // Ambil semua data dari Firestore
  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "data_umum"),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDataList(data);
    } catch (err) {
      console.error("Gagal fetch data:", err);
      alert("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------
  // Upload helper: kirim file ke backend (/upload)
  // backend mengembalikan { url, public_id, resource_type, format }
  // -------------------------
  const uploadFile = async (file) => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("http://localhost:3030/upload", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error("Upload error: " + t);
    }

    const data = await res.json();

    if (!data.url || !data.public_id) {
      throw new Error("Respons server tidak valid");
    }

    return {
      nama_file: file.name,
      file_url: data.url,
      public_id: data.public_id,
      resource_type: data.resource_type || "auto",
      format: data.format || extractExtFromFilename(file.name) || "",
    };
  };

  const extractExtFromFilename = (name) => {
    if (!name) return "";
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      let uploadedFiles = [];

      // jika ada file baru untuk diupload
      if (formData.files && formData.files.length > 0) {
        uploadedFiles = await Promise.all(
          formData.files.map((f) => uploadFile(f))
        );
      }

      // jika edit: gabungkan file lama (selected) dengan uploadedFiles baru
      let filesToSave = uploadedFiles;
      if (formData.id) {
        // ambil data lama untuk menggabungkan file (jika ada)
        const existing = dataList.find((d) => d.id === formData.id);
        if (existing && existing.files && existing.files.length > 0) {
          filesToSave = [...existing.files, ...uploadedFiles];
        }
      }

      const dataToSave = {
        materi: formData.materi,
        data: formData.data,
        kategori: formData.kategori,
        keterangan: formData.keterangan,
        files: filesToSave,
        updated_at: serverTimestamp(),
      };

      if (formData.id) {
        await updateDoc(doc(db, "data_umum", formData.id), dataToSave);
      } else {
        await addDoc(collection(db, "data_umum"), {
          ...dataToSave,
          created_at: serverTimestamp(),
        });
      }

      // reset & refresh
      setShowModal(false);
      setFormData({
        id: "",
        materi: "",
        data: "",
        kategori: "",
        keterangan: "",
        files: [],
      });
      fetchData();
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Gagal menyimpan data: " + (error.message || error));
    } finally {
      setSubmitLoading(false);
    }
  };

  // -------------------------
  // Edit, Delete, Info
  // -------------------------
  const handleEdit = (item) => {
    // jangan isi files dengan FileList; hanya siapkan form untuk upload file baru
    setFormData({
      id: item.id,
      materi: item.materi || "",
      data: item.data || "",
      kategori: item.kategori || "",
      keterangan: item.keterangan || "",
      files: [],
    });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    setLoading(true);

    try {
      // 🔹 Cek dulu apakah ada file yang perlu dihapus di Cloudinary
      if (item.files && item.files.length > 0) {
        // Gunakan Promise.all agar menunggu semua file selesai dihapus
        await Promise.all(
          item.files.map(async (f) => {
            if (f.public_id) {
              const response = await fetch("http://localhost:3030/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  public_id: f.public_id,
                  resource_type: f.resource_type || "auto",
                }),
              });


              // Cek hasil dari backend apakah berhasil
              const result = await response.json();
              if (!response.ok || result.error) {
                throw new Error(
                  `Gagal hapus file di Cloudinary: ${
                    result.error || response.statusText
                  }`
                );
              }
            }
          })
        );
      }

      // 🔹 Setelah semua file berhasil dihapus di Cloudinary, hapus Firestore
      await deleteDoc(doc(db, "data_umum", item.id));

      // 🔹 Refresh data
      fetchData();
    } catch (error) {
      console.error("Gagal menghapus data:", error);
      alert("Gagal menghapus data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInfo = (item) => {
    setSelectedData(item);
    setShowInfoModal(true);
  };

  // -------------------------
  // Filter simple
  // -------------------------
  const filteredItems = useMemo(() => {
    return dataList.filter(
      (item) =>
        item.materi?.toLowerCase().includes(filterText.toLowerCase()) ||
        item.kategori?.toLowerCase().includes(filterText.toLowerCase()) ||
        item.data?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [dataList, filterText]);

  // -------------------------
  // Columns DataTable
  // -------------------------
  const columns = [
    { name: "Materi", selector: (row) => row.materi, sortable: true },
    { name: "Kategori", selector: (row) => row.kategori, sortable: true },
    {
      name: "Data",
      selector: (row) => (row.data ? row.data.slice(0, 60) + "..." : ""),
      sortable: false,
      wrap: true,
    },
    {
      name: "Aksi",
      cell: (row) => {
        return (
          <div className="w-full flex gap-2">
            <button
              onClick={() => handleEdit(row)}
              className="p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Edit size={16} />
            </button>

            <button
              onClick={() => handleDelete(row)}
              className="p-2 rounded bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => handleInfo(row)}
              className="p-2 rounded bg-green-500 hover:bg-green-600 text-white"
            >
              <Info size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  // -------------------------
  // Utility: preview / download helpers
  // -------------------------
  const getExt = (f) => {
    if (!f) return "";
    // cek format field dulu, fallback ke nama_file
    const fromFormat = f.format || "";
    if (fromFormat) return fromFormat.toLowerCase();
    if (f.nama_file) {
      const parts = f.nama_file.split(".");
      return parts.length > 1 ? parts.pop().toLowerCase() : "";
    }
    // try extract from URL
    if (f.file_url) {
      const m = f.file_url.split("?")[0].match(/\.(\w+)$/);
      if (m) return m[1].toLowerCase();
    }
    return "";
  };

  // Download file: pakai atribut download supaya nama & ekstensi benar
  const renderDownloadLink = (f) => {
    return (
      <a
        href={f.file_url}
        download={f.nama_file || `file.${getExt(f) || "bin"}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm inline-flex items-center gap-2"
      >
        <Download size={14} /> Download
      </a>
    );
  };

  // -------------------------
  // Render component
  // -------------------------
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>
      <div className="lg:ml-64 mt-14 p-6 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-6 text-green-600 text-center md:text-left">
            Data Umum
          </h1>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-6">
          <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-4">
            <input
              type="text"
              placeholder="Cari data..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="border p-2 rounded w-full md:w-1/3"
            />
            <button
              onClick={() => {
                setFormData({
                  id: "",
                  materi: "",
                  data: "",
                  kategori: "",
                  keterangan: "",
                  files: [],
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <DataTable
                className="min-w-[150px]"
                columns={columns}
                data={filteredItems}
                striped
                pagination
                responsive
                highlightOnHover
                noDataComponent={<p className="py-10">Belum ada data umum.</p>}
              />
            )}
          </div>
        </div>

        {/* Modal tambah/edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-4">
                {formData.id ? "Edit Data" : "Tambah Data"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Materi</label>
                  <input
                    type="text"
                    value={formData.materi}
                    onChange={(e) =>
                      setFormData({ ...formData, materi: e.target.value })
                    }
                    required
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Kategori</label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    required
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Data</label>
                  <textarea
                    rows="3"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    required
                    className="w-full border p-2 rounded"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Keterangan
                  </label>
                  <textarea
                    rows="2"
                    value={formData.keterangan}
                    onChange={(e) =>
                      setFormData({ ...formData, keterangan: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium flex items-center gap-1">
                    <FileUp size={16} /> Upload Foto / File (bisa banyak)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        files: Array.from(e.target.files),
                      })
                    }
                    className="w-full border p-1 rounded"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="border px-4 py-2 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-white ${
                      submitLoading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {submitLoading && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {submitLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Info */}
        {showInfoModal && selectedData && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-[1000px] overflow-y-auto max-h-[90vh] relative">
              <h2 className="text-lg font-semibold mb-4 text-green-600">
                Detail Data Umum
              </h2>

              <div className="flex flex-col md:flex-row md:justify-between gap-6">
                <div className="md:w-1/2 font-medium flex flex-col gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Materi</p>
                    <p className="border border-gray-300 rounded-lg w-full py-1 px-2">
                      {selectedData.materi}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Kategori</p>
                    <p className="border border-gray-300 rounded-lg w-full py-1 px-2">
                      {selectedData.kategori}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="border border-gray-300 rounded-lg w-full py-1 px-2">
                      {selectedData.data}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Keterangan</p>
                    <p className="border border-gray-300 rounded-lg w-full py-1 px-2">
                      {selectedData.keterangan}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-row flex-wrap gap-4 md:w-1/2">
                  {selectedData.files && selectedData.files.length > 0 ? (
                    selectedData.files.map((f, idx) => {
                      const ext = getExt(f);
                      const isImage = [
                        "jpg",
                        "jpeg",
                        "png",
                        "gif",
                        "webp",
                      ].includes(ext);
                      const isPDF = ext === "pdf";

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center border border-gray-200 p-3 rounded-lg shadow-sm"
                        >
                          {/* Preview */}
                          {isImage ? (
                            <img
                              src={f.file_url}
                              alt={f.nama_file}
                              className="w-40 h-40 object-cover object-center rounded-lg border"
                            />
                          ) : isPDF ? (
                            <iframe
                              src={f.file_url}
                              title={f.nama_file}
                              className="w-40 h-40 border rounded"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center w-40 h-40">
                              <File size={40} />
                              <p className="text-xs text-gray-600 mt-2">
                                Tidak dapat dipratinjau
                              </p>
                            </div>
                          )}

                          {/* Nama */}
                          <p className="text-sm mt-2 text-center break-all max-w-[160px]">
                            {f.nama_file}
                          </p>

                          {/* Aksi */}
                          <div className="flex gap-2 mt-2">
                            {/* Lihat (untuk image/pdf buka di tab baru atau modal kecil jika mau) */}
                            {isImage || isPDF ? (
                              <a
                                href={f.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded inline-flex items-center gap-2"
                              >
                                <Eye size={14} /> Lihat
                              </a>
                            ) : null}

                            {/* Download */}
                            {renderDownloadLink(f)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada file.</p>
                  )}
                </div>
              </div>

              <div className="w-full flex justify-end gap-4 mt-6">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg">
                  Edit Keterangan
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-lg">
                  Tambah File
                </button>
              </div>

              <div className="absolute top-0 right-4 mt-4">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="border px-4 py-2 rounded"
                >
                  <X />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUmumAdmin;
