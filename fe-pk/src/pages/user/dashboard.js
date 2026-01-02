import React, { useEffect, useState } from "react";
import SidebarUser from "../../components/sidebar_user";
import { auth, db } from "../../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FolderOpen, HeartPulse, ListChecks } from "lucide-react";
import Select from "react-select";

/* =======================
   CONSTANT
======================= */
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

const bulanOptions = BULAN.map((b, i) => ({ value: i, label: b }));

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 100 }, (_, i) => ({
  value: currentYear - i,
  label: String(currentYear - i),
}));

const ITEMS_PER_PAGE = 4;

/* =======================
   COMPONENT
======================= */
const UserDashboard = () => {
  const now = new Date();

  /* SUMMARY */
  const [materiCount, setMateriCount] = useState(0);
  const [penyakitCount, setPenyakitCount] = useState(0);
  const [jenisPenyakitCount, setJenisPenyakitCount] = useState(0);

  /* FILTER */
  const [jenisList, setJenisList] = useState([]);
  const [selectedJenis, setSelectedJenis] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  /* CHART */
  const [chartData, setChartData] = useState([]);
  const [page, setPage] = useState(1);
  const [chartHeight, setChartHeight] = useState(320);

  /* =======================
     FETCH & PROCESS
  ======================= */
  useEffect(() => {
    setPage(1); // reset pagination

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      /* ===== CARD DATA ===== */
      const materiSnap = await getDocs(
        query(
          collection(db, "data_materi"),
          where("peserta_id", "==", user.uid)
        )
      );
      setMateriCount(materiSnap.size);

      const penyakitSnap = await getDocs(
        query(collection(db, "data_penyakit"), where("user_id", "==", user.uid))
      );
      setPenyakitCount(penyakitSnap.size);

      const jenisSnap = await getDocs(collection(db, "jenis_penyakit"));
      setJenisPenyakitCount(jenisSnap.size);

      /* ===== BUILD MAP JENIS (ID → NAMA_JENIS) ===== */
      const jenisMap = {};
      const jenisOptions = [];

      jenisSnap.forEach((doc) => {
        const nama = doc.data().nama_jenis;
        jenisMap[doc.id] = nama;
        jenisOptions.push({ value: doc.id, label: nama });
      });

      setJenisList(jenisOptions);

      /* ===== CHART DATA (ADMIN STYLE, PAKAI nama_jenis) ===== */
      const map = {};

      penyakitSnap.forEach((doc) => {
        const d = doc.data();
        if (!d.bulan || !d.id_jenis_penyakit) return;

        if (selectedJenis && d.id_jenis_penyakit !== selectedJenis) return;

        const date = d.bulan.toDate ? d.bulan.toDate() : new Date(d.bulan);

        if (
          date.getMonth() !== selectedMonth ||
          date.getFullYear() !== selectedYear
        )
          return;

        const namaJenis =
          jenisMap[d.id_jenis_penyakit] || "Jenis tidak diketahui";

        map[namaJenis] = (map[namaJenis] || 0) + 1;
      });

      const result = Object.keys(map).map((key) => ({
        name: key,
        total: map[key],
      }));

      result.sort((a, b) => b.total - a.total);
      setChartData(result);
    });

    /* ===== RESPONSIVE HEIGHT ===== */
    const resize = () => {
      if (window.innerWidth < 480) setChartHeight(220);
      else if (window.innerWidth < 768) setChartHeight(260);
      else setChartHeight(320);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      unsub();
      window.removeEventListener("resize", resize);
    };
  }, [selectedJenis, selectedMonth, selectedYear]);

  /* =======================
     PAGINATION
  ======================= */
  const totalPage = Math.ceil(chartData.length / ITEMS_PER_PAGE);

  const paginatedData = chartData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <SidebarUser />

      <div className="lg:ml-64 mt-14 p-6 w-full">
        <div className="text-center mb-10">
          <h1 className="text-7xl text-green-500 font-bold dynapuff">MoveOn</h1>
          <h2 className="text-xl font-bold text-green-600 dynapuff">
            Saatnya Bergerak, Saatnya MoveOn
          </h2>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            icon={<FolderOpen className="text-yellow-700" />}
            label="Data Materi"
            value={materiCount}
            className="bg-yellow-100 text-yellow-800"
          />

          <SummaryCard
            icon={<HeartPulse className="text-rose-600" />}
            label="Data Penyakit"
            value={penyakitCount}
            className="bg-rose-100 text-rose-800"
          />

          <SummaryCard
            icon={<ListChecks className="text-indigo-600" />}
            label="Jenis Penyakit"
            value={jenisPenyakitCount}
            className="bg-indigo-100 text-indigo-800"
          />
        </div>

        {/* FILTER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Select
            options={jenisList}
            value={jenisList.find((j) => j.value === selectedJenis) || null}
            onChange={(e) => setSelectedJenis(e ? e.value : "")}
            isClearable
            placeholder="Jenis penyakit"
          />
          <Select
            options={bulanOptions}
            value={bulanOptions.find((b) => b.value === selectedMonth)}
            onChange={(e) => setSelectedMonth(e.value)}
          />
          <Select
            options={yearOptions}
            value={yearOptions.find((y) => y.value === selectedYear)}
            onChange={(e) => setSelectedYear(e.value)}
          />
        </div>

        {/* CHART */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-bold mb-3">
            Grafik Penyakit – {BULAN[selectedMonth]} {selectedYear}
          </h2>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Tidak ada data pada periode ini
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={paginatedData} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#A78BFA" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {totalPage > 1 && (
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =======================
   CARD
======================= */
const SummaryCard = ({ icon, label, value, className = "" }) => (
  <div
    className={`p-6 rounded-2xl shadow
    hover:shadow-lg hover:-translate-y-1
    transition-all duration-300
    ${className}`}
  >
    <div className="flex justify-center mb-2 text-3xl">{icon}</div>
    <p className="text-sm opacity-80">{label}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

export default UserDashboard;
