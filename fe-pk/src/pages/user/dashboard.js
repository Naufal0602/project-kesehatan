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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FolderOpen, HeartPulse, ListChecks } from "lucide-react";
import Select from "react-select";

const UserDashboard = () => {
  const [materiCount, setMateriCount] = useState(0);
  const [penyakitCount, setPenyakitCount] = useState(0);
  const [jenisPenyakitCount, setJenisPenyakitCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [selectedJenis, setSelectedJenis] = useState(null);
  const [chartHeight, setChartHeight] = useState(300);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      const materiQ = query(
        collection(db, "data_materi"),
        where("peserta_id", "==", currentUser.uid)
      );
      const materiSnap = await getDocs(materiQ);
      setMateriCount(materiSnap.size);

      const penyakitQ = query(
        collection(db, "data_penyakit"),
        where("user_id", "==", currentUser.uid)
      );

      const penyakitSnap = await getDocs(penyakitQ);
      setPenyakitCount(penyakitSnap.size);

      const jenisSnap = await getDocs(collection(db, "jenis_penyakit"));
      setJenisPenyakitCount(jenisSnap.size);

      const jenisOptions = jenisSnap.docs.map((doc) => ({
        value: doc.id,
        label: doc.data().nama_jenis,
      }));
      setJenisList(jenisOptions);

      const monthly = new Array(12).fill(0);

      penyakitSnap.forEach((d) => {
        const data = d.data();
        if (selectedJenis && data.id_jenis_penyakit !== selectedJenis) return;

        const tgl = data.bulan;
        if (!tgl) return;

        const date = tgl?.toDate ? tgl.toDate() : new Date(tgl);
        const month = date.getMonth();
        if (!isNaN(month)) monthly[month]++;
      });

      setChartData([
        { name: "Jan", total: monthly[0] },
        { name: "Feb", total: monthly[1] },
        { name: "Mar", total: monthly[2] },
        { name: "Apr", total: monthly[3] },
        { name: "Mei", total: monthly[4] },
        { name: "Jun", total: monthly[5] },
        { name: "Jul", total: monthly[6] },
        { name: "Agu", total: monthly[7] },
        { name: "Sep", total: monthly[8] },
        { name: "Okt", total: monthly[9] },
        { name: "Nov", total: monthly[10] },
        { name: "Des", total: monthly[11] },
      ]);
    });

    const updateSize = () => {
      if (window.innerWidth < 480) {
        setChartHeight(200); // ukuran chart saat layar kecil
      } else if (window.innerWidth < 768) {
        setChartHeight(260);
      } else {
        setChartHeight(320);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [selectedJenis]);

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <SidebarUser />

      <div className="lg:ml-64 mt-14 p-6 w-full">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6">
          Dashboard User
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
            <div className="flex items-center gap-4">
              <FolderOpen className="text-indigo-600" size={34} />
              <div>
                <p className="text-sm text-slate-500">Data Materi Anda</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {materiCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
            <div className="flex items-center gap-4">
              <HeartPulse className="text-rose-600" size={34} />
              <div>
                <p className="text-sm text-slate-500">Data Penyakit</p>
                <p className="text-3xl font-bold text-rose-600">
                  {penyakitCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md hover:shadow-xl transition">
            <div className="flex items-center gap-4">
              <ListChecks className="text-amber-500" size={34} />
              <div>
                <p className="text-sm text-slate-500">Jenis Penyakit</p>
                <p className="text-3xl font-bold text-amber-500">
                  {jenisPenyakitCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="mb-4 w-full md:w-64">
          <Select
            options={jenisList}
            value={jenisList.find((j) => j.value === selectedJenis) || null}
            onChange={(e) => setSelectedJenis(e ? e.value : null)}
            isClearable
            isSearchable
            placeholder="Filter jenis penyakit..."
          />
        </div>

        {/* Chart */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md">
          <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-700">
            Grafik Penyakit Per Bulan
          </h2>

          <div className="w-full h-[250px] sm:h-[300px]">
            <div className="w-full" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
