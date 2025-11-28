import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../../components/sidebar";
import FullScreenLoader from "../../../components/FullScreenLoader";
import { useNavigate } from "react-router-dom";

import { db } from "../../../services/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const EditAntisipasiObat = () => {
  const { penyakitId, obatId } = useParams();

  const [loading, setLoading] = useState(false);
  const [loaderStatus, setLoaderStatus] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nama_obat: "",
    jenis: "",
    dosis: "",
    catatan: "",
  });

  // Ambil data obat dari SUBCOLLECTION
  useEffect(() => {
    const fetchData = async () => {
      try {
        const obatRef = doc(db, "jenis_penyakit", penyakitId, "obat", obatId);
        const obatSnap = await getDoc(obatRef);

        if (obatSnap.exists()) {
          setFormData(obatSnap.data());
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [penyakitId, obatId]);

  // Simpan edit
  const handleSave = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("Menyimpan perubahan...");

    try {
      const obatRef = doc(db, "jenis_penyakit", penyakitId, "obat", obatId);

      await updateDoc(obatRef, {
        ...formData,
      });

      setLoaderStatus("success");
      window.location.href = `/admin/data_penyakit/data_antisipasi`;
    } catch (err) {
      console.error(err);
      setLoaderStatus("error");
    }
  };

  return (
    <>
      {loading && <FullScreenLoader status={loaderStatus} message={message} />}

      <div className="flex min-h-screen bg-gray-100">
        <div className="fixed top-0 left-0">
          <Sidebar />
        </div>

        <div className="lg:ml-64 mt-14 p-8 w-full">
          <h1 className="text-2xl font-semibold mb-6">Edit Obat</h1>

          <form
            onSubmit={handleSave}
            className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto"
          >
            <label className="block mb-1 text-left font-medium">
              Nama Obat
            </label>
            <input
              type="text"
              className="border p-2 w-full rounded mb-4"
              value={formData.nama_obat}
              onChange={(e) =>
                setFormData({ ...formData, nama_obat: e.target.value })
              }
              required
            />

            <label className="block mb-1 text-left font-medium">Jenis</label>
            <input
              type="text"
              className="border p-2 w-full rounded mb-4"
              value={formData.jenis}
              onChange={(e) =>
                setFormData({ ...formData, jenis: e.target.value })
              }
              required
            />

            <label className="block mb-1 text-left font-medium">Dosis</label>
            <input
              type="text"
              className="border p-2 w-full rounded mb-4"
              value={formData.dosis}
              onChange={(e) =>
                setFormData({ ...formData, dosis: e.target.value })
              }
              required
            />

            <label className="block mb-1 text-left font-medium">Catatan</label>
            <textarea
              type="text"
              className="border p-2 w-full rounded mb-4"
              value={formData.catatan}
              onChange={(e) =>
                setFormData({ ...formData, catatan: e.target.value })
              }
            />

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
            >
              Simpan Perubahan
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/data_penyakit/data_antisipasi")}
              className="mt-4 bg-gray-300 text-black px-4 py-2 rounded w-full hover:bg-gray-400"
            >
              Batal
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditAntisipasiObat;
