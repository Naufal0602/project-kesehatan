import React, { useEffect, useState } from "react";
import { auth, db } from "../../../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import SidebarUser from "../../../components/sidebar_user";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "../../../components/FullScreenLoader";

export default function EditProfile() {
  const [form, setForm] = useState({});
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoBaru, setFotoBaru] = useState(null); // 🔥 file belum diupload sampai save
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "data_spesifik", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setForm(snap.data());
          setFotoPreview(snap.data().foto);
        }
      }
    });

    return () => unsub();
  }, []);

  // =======================
  // 🔹 DELETE Cloudinary
  // =======================
  const deleteFromBackend = async (public_id, resource_type) => {
    await fetch("https://project-kesehatan.vercel.app/api/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id, resource_type }),
    });
  };

  const uploadToBackend = async (file) => {
    const data = new FormData();
    data.append("file", file);

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dmqehg4y5/auto/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();
    return result;
  };

  // =======================
  // 🔹 Saat pilih foto → belum upload
  // =======================
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFotoBaru(file);

    // preview dulu
    setFotoPreview(URL.createObjectURL(file));
  };

  // =======================
  // 🔹 Simpan
  // =======================
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading("loading");

    let fotoURL = form.foto;
    let publicID = form.public_id;
    let resourceType = form.resource_type;

    try {
      // ===== FOTO =====
      if (fotoBaru) {
        if (publicID) {
          await deleteFromBackend(publicID, resourceType);
        }

        const uploaded = await uploadToBackend(fotoBaru);
        fotoURL = uploaded.url;
        publicID = uploaded.public_id;
        resourceType = uploaded.resource_type;
      }

      // ===== UPDATE 2 KOLEKSI SEKALIGUS =====
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), {
          nama: form.nama,
          updated_at: new Date(),
        }),

        updateDoc(doc(db, "data_spesifik", user.uid), {
          ...form,
          foto: fotoURL,
          public_id: publicID,
          resource_type: resourceType,
          updated_at: new Date(),
        }),
      ]);

      setLoading("success");
      setTimeout(() => navigate("/user/profile/user_profil"), 800);
    } catch (err) {
      console.error(err);
      setLoading("error");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {loading && (
        <FullScreenLoader status={loading} message="Menyimpan data..." />
      )}

      <SidebarUser />

      <div className="lg:ml-64 mt-14 p-8 w-full">
        <div className="bg-white rounded-2xl p-10 shadow-sm max-w-5xl mx-auto">
          {/* === GRID UTAMA === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* FOTO AREA */}
            <div className="flex flex-col items-center">
              <div className="relative lg:w-80 w-48 h-48 lg:h-80 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={fotoPreview || "https://via.placeholder.com/150"}
                  className="w-full h-full object-cover"
                  alt="foto profil"
                />

                {/* CAMERA ICON */}
                <label className="absolute top-2 left-2 bg-white p-2 rounded-full shadow cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                  📷
                </label>
              </div>

              <p className="text-gray-500 mt-3 text-sm">
                Klik icon untuk mengganti foto
              </p>
            </div>

            {/* FORM AREA */}
            <div className="space-y-5">
              <div>
                <label className="text-sm text-gray-600">Nama</label>
                <input
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="Nama lengkap"
                  value={form.nama || ""}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">NRP</label>
                <input
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="NRP"
                  value={form.nrp || ""}
                  onChange={(e) => setForm({ ...form, nrp: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">KTA</label>
                <input
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="KTA"
                  value={form.kta || ""}
                  onChange={(e) => setForm({ ...form, kta: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">LSPN</label>
                <input
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="LSPN"
                  value={form.lspsn || ""}
                  onChange={(e) => setForm({ ...form, lspsn: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Tanggal Lahir</label>
                <input
                  className="w-full p-3 border rounded-lg mt-1"
                  placeholder="TTL"
                  value={form.ttl || ""}
                  onChange={(e) => setForm({ ...form, ttl: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="lg:flex row item-center space-y-4 justify-center gap-5 mt-10">
            <button
              onClick={handleSave}
              className="px-10 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              SAVE
            </button>

            <button
              onClick={() => navigate(-1)}
              className="px-10 py-3 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
