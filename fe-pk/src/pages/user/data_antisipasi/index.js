/* Updated IndexAntisipasi with pagination, transitions, and removed unused variable warning */

import React, { useState, useEffect } from "react";
import SidebarUser from "../../../components/sidebar_user";
import { db } from "../../../services/firebaseConfig";

import { collection, getDocs } from "firebase/firestore";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";

const IndexAntisipasi = () => {
  const [penyakitList, setPenyakitList] = useState([]);
  const [selectedPenyakit, setSelectedPenyakit] = useState(null);
  const [obatList, setObatList] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownSelected, setDropdownSelected] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Ambil data penyakit
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "jenis_penyakit"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPenyakitList(data);
    };
    fetchData();
  }, []);

  const dropdownOptions = penyakitList.map((item) => ({
    label: item.nama_jenis,
    value: item.nama_jenis,
  }));

  const filteredPenyakit = penyakitList.filter((item) => {
    const matchSearch =
      item.nama_jenis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tips?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDropdown =
      !dropdownSelected || item.nama_jenis === dropdownSelected?.value;
    return matchSearch && matchDropdown;
  });

  const totalPages = Math.ceil(filteredPenyakit.length / itemsPerPage);
  const currentData = filteredPenyakit.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = async (item) => {
    setSelectedPenyakit(item);
    const obatRef = collection(db, "jenis_penyakit", item.id, "obat");
    const obatSnap = await getDocs(obatRef);
    const obatData = obatSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setObatList(obatData);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <SidebarUser />
      </div>

      <div className="lg:ml-64 mt-14 p-8 w-full">
        {/* Greeting */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl text-green-500 font-bold mb-6">Daftar Jenis Penyakit</h2>
        <div className="mb-6 flex justify-beetween flex-col md:flex-row md:items-center md:space-y-0 space-y-4 md:space-x-4">
          <input
            type="text"
            placeholder="Cari jenis penyakit dan tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <div className="w-full md:w-1/2">
            <Select
              options={dropdownOptions}
              value={dropdownSelected}
              onChange={(v) => {
                setDropdownSelected(v);
                setCurrentPage(1);
              }}
              isSearchable
              isClearable
              placeholder="Filter berdasarkan jenis penyakit..."
            />
          </div>
        </div>
        </div>

        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold">{item.nama_jenis}</h3>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {item.antisipasi}
                  </p>

                  <button
                    onClick={() => handleOpenModal(item)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg transition hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500"
                  >
                    Info
                  </button>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500">Tidak ada penyakit ditemukan...</p>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedPenyakit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl relative border border-gray-100"
              >
                <button
                  onClick={() => setSelectedPenyakit(null)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✖
                </button>

                <h2 className="text-3xl font-semibold mb-4 text-gray-800 capitalize">
                  {selectedPenyakit.nama_jenis}
                </h2>

                <div className="space-y-2 mb-4 text-gray-700">
                  <p>
                    <strong>Tips:</strong> {selectedPenyakit.tips}
                  </p>
                  <p>
                    <strong>Antisipasi:</strong> {selectedPenyakit.antisipasi}
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Daftar Obat
                </h3>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                  {obatList.length > 0 ? (
                    obatList.map((obat) => (
                      <div
                        key={obat.id}
                        className="p-4 border rounded-xl bg-gray-50"
                      >
                        <p>
                          <strong>Nama Obat:</strong> {obat.nama_obat}
                        </p>
                        <p>
                          <strong>Jenis:</strong> {obat.jenis}
                        </p>
                        <p>
                          <strong>Dosis:</strong> {obat.dosis}
                        </p>
                        <p>
                          <strong>Catatan:</strong> {obat.catatan}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-sm">
                      Tidak ada obat tersedia.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPenyakit(null)}
                  className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700"
                >
                  Tutup
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IndexAntisipasi;
