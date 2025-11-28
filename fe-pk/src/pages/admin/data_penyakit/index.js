import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../../components/sidebar";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { db } from "../../../services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDataPenyakit() {
  const [data, setData] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [selectedJenis, setSelectedJenis] = useState([]);
  const [search, setSearch] = useState("");

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0">
        <Sidebar />
      </div>

      <div className="lg:ml-64 mt-16 p-6 w-full">
        <h1 className="text-2xl font-bold text-green-600 mb-6">
          Data Penyakit Semua User
        </h1>

        {/* Filter Section */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
