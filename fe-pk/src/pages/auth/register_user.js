import React, { useState, useEffect } from "react";
import { db } from "../../services/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const RegisterPendingStyled = () => {
  const [formData, setFormData] = useState({
    nrp: "",
    nama: "",
    jenis_kelamin: "",
    ttl: "",
    lspsn: "",
    cabang: "",
    kta: "",
    id_tingkatan: "",
    foto: "", // ini nanti diisi setelah upload
    email: "",
    password: "",
    lembaga: "",
    requested_role: "user",
    public_id: "",
  });

  const [tingkatanList, setTingkatanList] = useState([]);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [fotoFile, setFotoFile] = useState(null); // simpan file yang dipilih
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔹 Ambil data tingkatan
  useEffect(() => {
    const fetchTingkatan = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tingkatan"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTingkatanList(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTingkatan();
  }, []);

  // 🔹 Handle input teks
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 🔹 Saat user pilih foto (belum upload ke Cloudinary)
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFotoFile(file);
    setPreviewFoto(URL.createObjectURL(file)); // tampilkan preview
  };

  // 🔹 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let uploadedUrl = formData.foto;
      let publicId = formData.public_id;
      let resourceType = formData.resource_type || "image";

      // 🟢 Upload ke Cloudinary hanya jika ada foto baru
      if (fotoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", fotoFile);

        formDataUpload.append("upload_preset", "react_unsigned");
        formDataUpload.append("folder", "react_uploads");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dmqehg4y5/auto/upload",
          {
            method: "POST",
            body: formDataUpload,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Upload foto gagal");
        }

        uploadedUrl = data.secure_url || data.url;
        publicId = data.public_id;
        resourceType = data.resource_type;
      }

      // 🟢 Simpan ke Firestore
      await addDoc(collection(db, "pending_users"), {
        ...formData,
        foto: uploadedUrl,
        public_id: publicId,
        resource_type: resourceType,
        status: "pending",
        created_at: serverTimestamp(),
      });

      setSuccess("Data berhasil dikirim! Menunggu persetujuan admin.");

      setFormData({
        nrp: "",
        nama: "",
        email: "",
        password: "",
        lembaga: "",
        jenis_kelamin: "",
        ttl: "",
        lspsn: "",
        cabang: "",
        kta: "",
        id_tingkatan: "",
        foto: "",
        requested_role: "user",
        public_id: "",
        resource_type: "",
      });

      setPreviewFoto(null);
      setFotoFile(null);

      setTimeout(() => navigate("/waiting"), 2000);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-3xl">
        <h2 className="text-2xl font-semibold text-center text-green-600 mb-6">
          Register Akun Baru
        </h2>

        <div className="flex flex-col items-center mb-6">
          <label
            htmlFor="foto"
            className="w-32 h-32 rounded-full bg-gray-100 border flex items-center justify-center cursor-pointer"
          >
            {previewFoto ? (
              <img
                src={previewFoto}
                alt="Foto Profil"
                className="w-32 h-32 object-cover rounded-full"
              />
            ) : (
              <div id="camera" className="text-gray-400 text-sm text-center">
                <Camera className="mx-auto mb-1" />
              </div>
            )}
          </label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="hidden"
            required
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">NRP</label>
              <input
                type="text"
                name="nrp"
                value={formData.nrp}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">Jenis Kelamin</label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700">Tanggal Lahir</label>
              <input
                type="date"
                name="ttl"
                value={formData.ttl}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">LSPSN</label>
              <input
                type="text"
                name="lspsn"
                value={formData.lspsn}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">Cabang</label>
              <input
                type="text"
                name="cabang"
                value={formData.cabang}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">Nomor KTA</label>
              <input
                type="text"
                name="kta"
                value={formData.kta}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">Tingkatan</label>
              <select
                name="id_tingkatan"
                value={formData.id_tingkatan}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Pilih tingkatan</option>
                {tingkatanList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama_tingkatan}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input tambahan untuk email dan lembaga */}
          <div className="mt-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-700">Lembaga</label>
            <input
              type="text"
              name="lembaga"
              value={formData.lembaga}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-gray-700">Daftar Sebagai</label>
            <select
              name="requested_role"
              value={formData.requested_role}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded mt-4"
          >
            {loading ? "Menyimpan..." : "Simpan Data"}
          </button>
        </form>
        <Link
          to="/login"
          className="
                      mt-6 block w-full text-center
                      bg-gradient-to-r from-blue-600 to-blue-700
                      text-white font-semibold
                      px-4 py-3 rounded-xl
                      shadow-md
                      transition-all duration-300 ease-out
                      hover:-translate-y-1 hover:shadow-xl hover:from-blue-500 hover:to-blue-700
                      active:translate-y-0 active:shadow-md"
        >
          Kembali
        </Link>
      </div>
    </div>
  );
};

export default RegisterPendingStyled;
