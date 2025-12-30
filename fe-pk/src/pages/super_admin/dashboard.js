import React, { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar_super_admin";
import { db } from "../../services/firebaseConfig";
import { collection, getDocs, query } from "firebase/firestore";
import { Users, HeartPulse, ListChecks } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [penyakitCount, setPenyakitCount] = useState(0);
  const [jenisCount, setJenisCount] = useState(0);

  const [chartData, setChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [detailData, setDetailData] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState("10000");
  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  /* ===================== DETAIL POPUP ===================== */
  const loadDetail = async (jenisId, jenisNama) => {
    const snap = await getDocs(collection(db, "data_penyakit"));
    const list = [];

    snap.forEach((doc) => {
      const d = doc.data();
      if (!d.bulan) return;

      const date = d.bulan.toDate ? d.bulan.toDate() : new Date(d.bulan);

      if (
        date.getMonth() === selectedMonth &&
        d.id_jenis_penyakit === jenisId
      ) {
        list.push(d);
      }
    });

    setSelectedJenis(jenisNama);
    setDetailData(list);
    setShowDetail(true);
  };

  /* ===================== FETCH DATA ===================== */
  useEffect(() => {
    const fetchAll = async () => {
      // CARD DATA
      const userQ = query(collection(db, "users"));
      setUserCount((await getDocs(userQ)).size);
      setPenyakitCount((await getDocs(collection(db, "data_penyakit"))).size);
      setJenisCount((await getDocs(collection(db, "jenis_penyakit"))).size);

      // CHART DATA
      const jenisSnap = await getDocs(collection(db, "jenis_penyakit"));
      const penyakitSnap = await getDocs(collection(db, "data_penyakit"));

      const result = [];

      jenisSnap.forEach((jenisDoc) => {
        let total = 0;

        penyakitSnap.forEach((pDoc) => {
          const p = pDoc.data();
          if (!p.bulan) return;

          const date = p.bulan.toDate ? p.bulan.toDate() : new Date(p.bulan);

          if (
            date.getMonth() === selectedMonth &&
            p.id_jenis_penyakit === jenisDoc.id
          ) {
            total++;
          }
        });

        result.push({
          name: jenisDoc.data().nama_jenis,
          total,
          jenisId: jenisDoc.id,
        });
      });

      result.sort((a, b) => b.total - a.total);
      setChartData(result);
    };

    fetchAll();
    if (window.innerWidth < 640) {
      setLimit(5);
    }
    setPage(1);
  }, [search, limit, selectedMonth]);

  // SEARCH
  const searchedData = chartData.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // TOP N
  const limitedData = searchedData.slice(0, limit);

  // PAGINATION
  const totalPage = Math.ceil(limitedData.length / ITEMS_PER_PAGE);

  const paginatedData = limitedData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0">
        <Sidebar />
      </div>

      <div className="lg:ml-64 mt-16 p-6 w-full">
        <div className="text-center mb-10">
          <h1 className="text-7xl text-green-500 font-bold dynapuff">MoveOn</h1>
          <h2 className="text-xl font-bold text-green-600 dynapuff">
            Saatnya Bergerak, Saatnya MoveOn
          </h2>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card
            icon={<Users />}
            label="Total User"
            value={userCount}
            color="blue"
          />
          <Card
            icon={<HeartPulse />}
            label="Data Penyakit"
            value={penyakitCount}
            color="rose"
          />
          <Card
            icon={<ListChecks />}
            label="Jenis Penyakit"
            value={jenisCount}
            color="amber"
          />
        </div>

        {/* FILTER BULAN */}
      <div className="bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="mb-4 px-4 py-2 border rounded-lg"
        >
          {BULAN.map((b, i) => (
            <option key={i} value={i}>
              {b}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Cari jenis penyakit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full md:w-1/3 mb-3"
        />
        </div>

        {/* CHART */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart layout="vertical" data={paginatedData}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Bar
                dataKey="total"
                fill="#16A34A"
                onClick={(e) => loadDetail(e.payload.jenisId, e.payload.name)}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex justify-between items-center mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm text-gray-600">
              Page {page} dari {totalPage}
            </span>

            <button
              disabled={page === totalPage}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">
              Detail Penyakit: {selectedJenis}
            </h3>

            <div className="max-h-80 overflow-y-auto">
              {detailData.map((d, i) => (
                <div key={i} className="border-b py-2 text-sm">
                  {new Date(d.bulan.toDate()).toLocaleDateString("id-ID")}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDetail(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ icon, label, value, color }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className={`${colorMap[color]} p-6 rounded-2xl text-center shadow`}>
      <div className="mb-2 flex justify-center">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};


export default AdminDashboard;
