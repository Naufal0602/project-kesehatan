import React, { useEffect, useState } from "react";
import Sidebar from "../../../components/sidebar";
import DataTable from "react-data-table-component";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../services/firebaseConfig";
import ConfirmModal from "../../../components/ConfirmModal";
import FullScreenLoader from "../../../components/FullScreenLoader";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";
import { Info, Pencil, X,Trash2 } from "lucide-react";
const AdminDataPenyakitDetail = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [newAntisipasi, setNewAntisipasi] = useState("");
  const [newTips, setNewTips] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loaderStatus, setLoaderStatus] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [format, setFormat] = useState("pdf"); // default PDF

  const [newObat, setNewObat] = useState({
    nama_obat: "",
    dosis: "",
    jenis: "",
    catatan: "",
  });

  const handleDelete = async (target) => {
    setLoaderStatus("loading");

    try {
      if (target.type === "obat") {
        const obatRef = doc(
          db,
          "jenis_penyakit",
          target.parentId,
          "obat",
          target.obatId
        );

        await deleteDoc(obatRef);
        setLoaderStatus("success");
        return;
      }

      if (target.type === "antisipasi") {
        const docRef = doc(db, "jenis_penyakit", target.parentId);

        await updateDoc(docRef, {
          antisipasi: selectedData.antisipasi.filter(
            (_, idx) => idx !== target.index
          ),
          updated_at: new Date(),
        });

        setLoaderStatus("success");
        return;
      }
    } catch (err) {
      console.error(err);
      setLoaderStatus("error");
    }
  };

  // Ambil semua jenis penyakit beserta subcollection obat
  const fetchData = async () => {
    setLoading(true);
    const jenisSnapshot = await getDocs(collection(db, "jenis_penyakit"));
    const jenisList = [];

    for (const docSnap of jenisSnapshot.docs) {
      const jenisData = docSnap.data();
      const obatSnapshot = await getDocs(
        collection(db, "jenis_penyakit", docSnap.id, "obat")
      );
      const obatList = obatSnapshot.docs.map((o) => ({
        id: o.id,
        ...o.data(),
      }));

      jenisList.push({ id: docSnap.id, ...jenisData, obatList });
    }

    setData(jenisList);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tambah antisipasi baru
  const handleAddAntisipasi = async (id) => {
    if (!newAntisipasi.trim()) return;
    const ref = doc(db, "jenis_penyakit", id);
    await updateDoc(ref, { antisipasi: arrayUnion(newAntisipasi) });
    setNewAntisipasi("");
    fetchData();
  };

  // Tambah obat baru
  const handleAddObat = async (id) => {
    if (!newObat.nama_obat.trim()) return;
    const obatRef = collection(db, "jenis_penyakit", id, "obat");
    await addDoc(obatRef, {
      nama_obat: newObat.nama_obat,
      dosis: newObat.dosis,
      jenis: newObat.jenis,
      catatan: newObat.catatan,
      created_at: new Date(),
    });
    setNewObat({ nama_obat: "", dosis: "", jenis: "", catatan: "" });
    fetchData();
  };

  // Update tips
  const handleUpdateTips = async (id) => {
    const ref = doc(db, "jenis_penyakit", id);
    await updateDoc(ref, {
      tips: newTips,
      updated_at: new Date(),
    });
    setNewTips("");
    fetchData();
  };

  const columns = [
    {
      name: "Nama Jenis Penyakit",
      selector: (row) => row.nama_jenis,
      sortable: true,
      wrap: true,
    },
    {
      name: "Antisipasi",
      cell: (row) =>
        row.antisipasi?.length ? (
          <ul className="list-disc ml-4 text-left">
            {row.antisipasi.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        ) : (
          <span className="text-gray-400 italic">Belum ada</span>
        ),
      wrap: true,
    },
    {
      name: "Tips",
      selector: (row) => row.tips || "Belum ada",
      wrap: true,
    },
    {
      name: "Obat",
      cell: (row) => {
        if (!row.obatList?.length) {
          return <span className="text-gray-400 italic">Belum ada</span>;
        }

        const limit = 1; // tampilkan hanya 2 item pertama
        const displayList = row.obatList.slice(0, limit);

        return (
          <div className="text-left">
            <ul className="list-disc ml-4">
              {displayList.map((o, i) => (
                <li key={i}>
                  {o.nama_obat} ({o.jenis}) - {o.dosis}
                </li>
              ))}
            </ul>

            {row.obatList.length > limit && (
              <span className="text-gray-500 text-sm italic">...</span>
            )}
          </div>
        );
      },
      wrap: true,
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedData(row);
              setShowInfoModal(true);
            }}
            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700
                       flex items-center justify-center"
          >
            <span className="block md:hidden">
              <Info size={14} />
            </span>
            <span className="hidden md:block">Info</span>
          </button>

          <button
            onClick={() => {
              setSelectedData(row);
              setShowEditModal(true);
              setNewTips(row.tips || "");
            }}
            className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700
                       flex items-center justify-center"
          >
            <span className="block md:hidden">＋</span>
            <span className="hidden md:block">+ Tambah</span>
          </button>
        </div>
      ),
    },
  ];
  const printPdfAll = () => {
    const doc = new jsPDF({
      orientation: "portrait", // sesuai permintaan
      unit: "mm",
      format: "a4",
    });

    const marginLeft = 14;
    const marginRight = 14;

    doc.setFontSize(16);
    doc.text("Data Jenis Penyakit", marginLeft, 15);

    const tableData = data.map((item, i) => {
      const antisipasiTxt = item.antisipasi?.join(", ") || "-";
      const obatTxt =
        item.obatList
          ?.map((o) => `${o.nama_obat} (${o.jenis}) - ${o.dosis}`)
          .join("; ") || "-";

      return [i + 1, item.nama_jenis, antisipasiTxt, item.tips || "-", obatTxt];
    });

    autoTable(doc, {
      startY: 22,
      margin: { left: marginLeft, right: marginRight },

      head: [["No", "Nama Jenis", "Antisipasi", "Tips", "Obat"]],
      body: tableData,

      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: "linebreak", // wrap otomatis
      },

      headStyles: {
        fillColor: [34, 139, 34],
        textColor: 255,
        fontSize: 11,
      },

      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35, overflow: "linebreak" },
        2: { cellWidth: 40, overflow: "linebreak" },
        3: { cellWidth: 30, overflow: "linebreak" },
        4: { cellWidth: "auto", overflow: "linebreak" }, // biar obat wrap rapi
      },
    });

    doc.save("data_penyakit.pdf");
  };

  const printPdfRange = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const filtered = data.filter((item) => {
      const t = item.created_at?.toDate();
      return t >= from && t <= to;
    });

    // Format data untuk PDF table
    const tableData = filtered.map((item, i) => {
      const obatFormatted = item.obatList
        ?.map((o) => `${o.nama_obat} (${o.jenis}) - ${o.dosis}`)
        .join("; ");

      return [
        i + 1,
        item.nama_jenis,
        item.antisipasi?.join(", ") || "-",
        item.tips || "-",
        obatFormatted || "-",
      ];
    });

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text("Data Jenis Penyakit (Filter Tanggal)", 14, 15);

    autoTable(doc, {
      head: [["No", "Nama Jenis", "Antisipasi", "Tips", "Obat"]],
      body: tableData,
      startY: 25,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [22, 160, 133], // hijau soft
        textColor: 255,
        fontSize: 11,
      },
    });

    doc.save("data_penyakit_filter.pdf");
  };

  const printExcelAll = () => {
    const cleanData = data.map((item) => {
      const obatFormatted = item.obatList
        ?.map((o) => `${o.nama_obat} (${o.jenis}) - ${o.dosis}`)
        .join("; ");

      return {
        nama_jenis: item.nama_jenis,
        antisipasi: item.antisipasi?.join(", "),
        tips: item.tips || "",
        obat: obatFormatted || "", // dipakai
        // obatList tidak dimasukkan
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Penyakit");

    XLSX.writeFile(workbook, "data_penyakit.xlsx");
  };

  const printExcelRange = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const filtered = data.filter((item) => {
      const t = item.created_at?.toDate();
      return t >= from && t <= to;
    });

    const cleanData = filtered.map((item) => {
      const obatFormatted = item.obatList
        ?.map((o) => `${o.nama_obat} (${o.jenis}) - ${o.dosis}`)
        .join("; ");

      return {
        nama_jenis: item.nama_jenis,
        antisipasi: item.antisipasi?.join(", "),
        tips: item.tips || "",
        obat: obatFormatted || "",
        // obatList tidak dimasukkan
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Penyakit");
    XLSX.writeFile(workbook, "data_penyakit_filtered.xlsx");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <Sidebar />
      </div>

      <ConfirmModal
        show={showConfirm}
        title="Konfirmasi Hapus"
        message="Data ini akan dihapus secara permanen. Lanjutkan?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => handleDelete(deleteTarget)}
      />

      {loaderStatus && <FullScreenLoader status={loaderStatus} />}

      <div className="lg:ml-64 mt-14 p-8 w-full bg-gray-50">
        <h1 className="text-2xl font-bold text-green-700 mb-6 text-center bg-white p-4 rounded shadow-md">
          Data Jenis Penyakit (Obat, Antisipasi & Tips)
        </h1>
        <div className="flex mb-4 w-full justify-end justify-items-end">
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Print
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <DataTable
            columns={columns}
            data={data}
            progressPending={loading}
            pagination
            highlightOnHover
          />
        </div>

        {/* Modal INFO */}
        {showInfoModal && selectedData && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-2">
            <div
              className="bg-gray-50 rounded-xl shadow-lg 
                w-full sm:w-[600px] 
                max-h-[90vh] 
                p-4 sm:p-6 
                overflow-y-auto"
            >
              {/* ===== HEADER ===== */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-green-700">
                  Info Jenis Penyakit
                </h2>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X size={22} />
                </button>
              </div>

              <p className="font-semibold mb-4 text-sm sm:text-base">
                Nama: {selectedData.nama_jenis}
              </p>

              {/* ================= ANTISIPASI ================= */}
              <h3 className="font-semibold text-base sm:text-lg">Antisipasi</h3>

              <div className="overflow-x-auto mt-2">
                <table className="w-full min-w-[500px] border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Isi</th>
                      <th className="border p-2 text-center w-[120px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.antisipasi?.length ? (
                      selectedData.antisipasi.map((a, i) => (
                        <tr key={i}>
                          <td className="border p-2">{a}</td>
                          <td className="border p-2">
                            <div className="flex gap-2 justify-center sm:justify-start">
                              {/* EDIT */}
                              <button
                                title="Edit"
                                onClick={() =>
                                  (window.location.href = `/admin/data_penyakit/edit_antisipasi/${selectedData.id}/${i}`)
                                }
                                className="bg-blue-500 text-white p-2 rounded flex items-center gap-1 hover:bg-blue-600"
                              >
                                <Pencil size={16} />
                                <span className="hidden sm:inline">Edit</span>
                              </button>

                              {/* HAPUS */}
                              <button
                                title="Hapus"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "antisipasi",
                                    parentId: selectedData.id,
                                    index: i,
                                  });
                                  setShowConfirm(true);
                                }}
                                className="bg-red-500 text-white p-2 rounded flex items-center gap-1 hover:bg-red-600"
                              >
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          className="text-center p-3 italic text-gray-500"
                        >
                          Belum ada antisipasi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ================= OBAT ================= */}
              <h3 className="font-semibold text-base sm:text-lg mt-8">Obat</h3>

              <div className="overflow-x-auto mt-2">
                <table className="w-full min-w-[700px] border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Nama Obat</th>
                      <th className="border p-2">Jenis</th>
                      <th className="border p-2">Dosis</th>
                      <th className="border p-2 text-center w-[120px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.obatList?.length ? (
                      selectedData.obatList.map((o, i) => (
                        <tr key={i}>
                          <td className="border p-2">{o.nama_obat}</td>
                          <td className="border p-2">{o.jenis}</td>
                          <td className="border p-2">{o.dosis}</td>
                          <td className="border p-2">
                            <div className="flex gap-2 justify-center sm:justify-start">
                              {/* EDIT */}
                              <button
                                title="Edit"
                                onClick={() =>
                                  (window.location.href = `/admin/data_penyakit/edit_antisipasi_obat/${
                                    selectedData.id
                                  }/${o.id || i}`)
                                }
                                className="bg-blue-500 text-white p-2 rounded flex items-center gap-1 hover:bg-blue-600"
                              >
                                <Pencil size={16} />
                                <span className="hidden sm:inline">Edit</span>
                              </button>

                              {/* HAPUS */}
                              <button
                                title="Hapus"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "obat",
                                    parentId: selectedData.id,
                                    obatId: o.id,
                                  });
                                  setShowConfirm(true);
                                }}
                                className="bg-red-600 text-white p-2 rounded flex items-center gap-1 hover:bg-red-700"
                              >
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center p-3 italic text-gray-500"
                        >
                          Belum ada obat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ===== FOOTER ===== */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal EDIT */}
        {showEditModal && selectedData && (
          <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-40 z-50">
            <div className="bg-white rounded-lg shadow-lg w-[500px] p-6 overflow-y-auto max-h-[80vh]">
              <h2 className="text-xl font-bold mb-3 text-blue-700">
                Edit {selectedData.nama_jenis}
              </h2>

              {/* Tambah Antisipasi */}
              <h3 className="font-semibold mb-1">Tambah Antisipasi</h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="border rounded w-full p-2"
                  placeholder="Tulis antisipasi baru..."
                  value={newAntisipasi}
                  onChange={(e) => setNewAntisipasi(e.target.value)}
                />
                <button
                  onClick={() => handleAddAntisipasi(selectedData.id)}
                  className="bg-green-600 text-white px-3 rounded hover:bg-green-700"
                >
                  +
                </button>
              </div>

              {/* Edit Tips */}
              <h3 className="font-semibold mb-1">Edit Tips</h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="border rounded w-full p-2"
                  placeholder="Masukkan tips..."
                  value={newTips}
                  onChange={(e) => setNewTips(e.target.value)}
                />
                <button
                  onClick={() => handleUpdateTips(selectedData.id)}
                  className="bg-yellow-500 text-white px-3 rounded hover:bg-yellow-600"
                >
                  Simpan
                </button>
              </div>

              {/* Tambah Obat */}
              <h3 className="font-semibold mb-1">Tambah Obat</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  className="border rounded p-2"
                  placeholder="Nama obat"
                  value={newObat.nama_obat}
                  onChange={(e) =>
                    setNewObat({ ...newObat, nama_obat: e.target.value })
                  }
                />
                <input
                  className="border rounded p-2"
                  placeholder="Jenis"
                  value={newObat.jenis}
                  onChange={(e) =>
                    setNewObat({ ...newObat, jenis: e.target.value })
                  }
                />
                <input
                  className="border rounded p-2"
                  placeholder="Dosis"
                  value={newObat.dosis}
                  onChange={(e) =>
                    setNewObat({ ...newObat, dosis: e.target.value })
                  }
                />
                <input
                  className="border rounded p-2"
                  placeholder="Catatan"
                  value={newObat.catatan}
                  onChange={(e) =>
                    setNewObat({ ...newObat, catatan: e.target.value })
                  }
                />
              </div>
              <button
                onClick={() => handleAddObat(selectedData.id)}
                className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
              >
                Tambah Obat
              </button>

              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[350px] shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Print Data</h2>

              {/* PILIH FORMAT */}
              <label className="text-sm font-medium">Format File:</label>
              <select
                className="border w-full p-2 rounded mb-4"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (.xlsx)</option>
              </select>

              {/* PRINT SEMUA */}
              <button
                className="w-full bg-blue-600 text-white py-2 rounded mb-4"
                onClick={() => {
                  if (format === "pdf") printPdfAll();
                  else printExcelAll();
                }}
              >
                Print Semua
              </button>

              <hr className="my-4" />

              {/* PRINT SEBAGIAN */}
              <div>
                <p className="font-medium mb-2">Print berdasarkan tanggal</p>

                <label className="text-sm">Dari tanggal:</label>
                <input
                  type="date"
                  className="border w-full p-2 rounded mb-3"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />

                <label className="text-sm">Sampai tanggal:</label>
                <input
                  type="date"
                  className="border w-full p-2 rounded mb-4"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />

                <button
                  className="w-full bg-purple-600 text-white py-2 rounded"
                  onClick={() => {
                    if (!fromDate || !toDate)
                      return alert("Tanggal belum lengkap");

                    if (format === "pdf") printPdfRange();
                    else printExcelRange();
                  }}
                >
                  Print Berdasarkan Tanggal
                </button>
              </div>

              <button
                className="mt-5 w-full bg-gray-300 py-2 rounded"
                onClick={() => setShowPrintModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDataPenyakitDetail;
