import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../../services/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Camera, ImageUp } from "lucide-react"; // icon kamera

const InformasiPengguna = () => {
  const [formData, setFormData] = useState({
    nrp: "",
    nama: "",
    jenis_kelamin: "",
    ttl: "",
    lspsn: "",
    cabang: "",
    kta: "",
    id_tingkatan: "",
    foto: null,
    preview: null,
  });

  const [tingkatanList, setTingkatanList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);


  useEffect(() => {
    const fetchTingkatan = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tingkatan"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTingkatanList(list);
      } catch (err) {
        console.error("Gagal ambil tingkatan:", err);
      }
    };
    fetchTingkatan();
  }, []);

  // 🔹 Handle input biasa
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Handle upload foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        foto: file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  // 🔹 Klik area lingkaran = buka file picker
  const handleCircleClick = () => {
    fileInputRef.current.click();
  };

  // 🔹 Submit data ke Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("User tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "data_spesifik", user.uid), {
        nrp: formData.nrp,
        nama: formData.nama,
        jenis_kelamin: formData.jenis_kelamin,
        ttl: formData.ttl,
        lspsn: formData.lspsn,
        cabang: formData.cabang,
        kta: formData.kta,
        id_tingkatan: formData.id_tingkatan,
        foto: formData.preview || "", // bisa diganti upload ke Cloudinary
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      alert("Informasi pengguna berhasil disimpan!");
      navigate("/user/dashboard");
    } catch (err) {
      console.error("Error menyimpan data:", err);
      setError("Gagal menyimpan data. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">
          Informasi Pengguna
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {/* 🔸 FOTO PROFIL */}
          <div className="col-span-2 flex flex-col items-center">
            <label className="block text-gray-700 mb-2">Foto Profil</label>

            <div
              className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group shadow-md"
              onClick={handleCircleClick}
            >
              {formData.preview ? (
                <img
                  src={formData.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  <ImageUp className="w-8 h-8" />
                </div>
              )}

              {/* Overlay muncul saat hover */}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>

            {/* Hidden input file */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFotoChange}
              className="hidden"
            />
          </div>

          {/* 🔸 FORM FIELD */}
          <div className="col-span-2">
            <label className="block text-gray-700">NRP</label>
            <input
              type="text"
              name="nrp"
              value={formData.nrp}
              onChange={handleChange}
              required
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Jenis Kelamin</label>
            <select
              name="jenis_kelamin"
              value={formData.jenis_kelamin}
              onChange={handleChange}
              required
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700">Tanggal Lahir</label>
            <input
              type="date"
              name="ttl"
              value={formData.ttl}
              onChange={handleChange}
              required
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">LSPSN</label>
            <input
              type="text"
              name="lspsn"
              value={formData.lspsn}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Cabang</label>
            <input
              type="text"
              name="cabang"
              value={formData.cabang}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Nomor KTA(Kartu Tanda Anggota)</label>
            <input
              type="text"
              name="kta"
              value={formData.kta}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Tingkatan</label>
            <select
              name="id_tingkatan"
              value={formData.id_tingkatan}
              onChange={handleChange}
              required
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">Pilih tingkatan</option>
              {tingkatanList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama_tingkatan}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300"
          >
            {loading ? "Menyimpan..." : "Simpan Data"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InformasiPengguna;
