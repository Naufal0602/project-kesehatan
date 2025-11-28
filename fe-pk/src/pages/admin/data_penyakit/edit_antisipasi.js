import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../../components/sidebar";
import FullScreenLoader from "../../../components/FullScreenLoader";

import { db } from "../../../services/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const EditAntisipasi = () => {
  const { penyakitId, index } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loaderStatus, setLoaderStatus] = useState(null);
  const [message, setMessage] = useState("");

  const [value, setValue] = useState("");

  // Ambil data array antisipasi
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "jenis_penyakit", penyakitId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const arr = data.antisipasi || [];

          if (arr[index] !== undefined) {
            setValue(arr[index]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [penyakitId, index]);

  // Simpan perubahan
  const handleSave = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("Menyimpan perubahan...");

    try {
      const ref = doc(db, "jenis_penyakit", penyakitId);
      const snap = await getDoc(ref);
      const data = snap.data();

      let arr = [...(data.antisipasi || [])];
      arr[index] = value; // update item

      await updateDoc(ref, {
        antisipasi: arr,
      });

      setLoaderStatus("success");
        navigate("/admin/data_penyakit/data_antisipasi");

    } catch (err) {
      console.error(err);
      setLoaderStatus("error");

      setTimeout(() => {
        navigate("/admin/data_penyakit/data_antisipasi");
      }, 1500);
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
          <h1 className="text-2xl font-semibold mb-6">Edit Antisipasi</h1>

          <form
            onSubmit={handleSave}
            className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto"
          >
            <label className="block mb-1 text-left font-medium">
              Antisipasi
            </label>
            <input
              type="text"
              className="border p-2 w-full rounded mb-4"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
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

export default EditAntisipasi;
