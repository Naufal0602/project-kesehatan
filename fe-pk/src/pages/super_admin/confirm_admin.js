import React, { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar_super_admin";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { secondaryAuth, db } from "../../services/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Loader2, X, Eye, CheckCircle, XCircle } from "lucide-react";
import FullScreenLoader from "../../components/FullScreenLoader";
import ConfirmModal from "../../components/ConfirmModal";
import AcceptAccountModal from "../../components/AcceptAccountModal";
import DataTable from "react-data-table-component";
import emailjs from "@emailjs/browser";

const ConfirmAccount = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loader, setLoader] = useState({
    visible: false,
    status: "loading",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "", // "accept" | "reject"
    user: null,
  });
  const [acceptModal, setAcceptModal] = useState({
    show: false,
    user: null,
  });

  const columns = [
    {
      name: "Nama",
      selector: (row) => row.nama,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
    {
      name: "Lembaga",
      selector: (row) => row.lembaga,
    },
    {
      name: "Tingkatan",
      selector: (row) => row.nama_tingkatan,
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div className="flex gap-2 justify-center">
          {/* DETAIL */}
          <button
            onClick={() => handleView(row)}
            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 md:px-3 md:py-1 rounded"
            title="Detail"
          >
            <Eye size={18} />
          </button>

          {/* TERIMA */}
          <button
            onClick={() => setAcceptModal({ show: true, user: row })}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-2 md:px-3 md:py-1 rounded"
            title="Terima"
          >
            <CheckCircle size={18} />
          </button>

          {/* TOLAK */}
          <button
            onClick={() =>
              setConfirmModal({ show: true, type: "reject", user: row })
            }
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2 py-2 md:px-3 md:py-1 rounded"
            title="Tolak"
          >
            <XCircle size={18} />
          </button>
        </div>
      ),
    },
  ];

  // 🔹 Ambil data pending_users
  useEffect(() => {
    const fetchPendingUsers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "pending_users"));
        const users = await Promise.all(
          querySnapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
            // 🔥 FILTER WAJIB
            .filter((u) => u.requested_role === "admin")
            .map(async (data) => {
              let nama_tingkatan = "-";
              if (data.id_tingkatan) {
                const tingkatanDoc = await getDoc(
                  doc(db, "tingkatan", data.id_tingkatan)
                );
                if (tingkatanDoc.exists()) {
                  nama_tingkatan = tingkatanDoc.data().nama_tingkatan;
                }
              }
              return { ...data, nama_tingkatan };
            })
        );

        setPendingUsers(users);
      } catch (err) {
        console.error("Gagal mengambil data pending_admin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  // ✅ Fungsi Terima
  const handleAccept = async () => {
    const user = acceptModal.user;
    if (!user) return;

    setAcceptModal({ show: false, user: null });
    showLoader("loading", "Menyetujui akun admin...");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        user.email,
        user.password
      );

      const createdUser = userCredential.user;

      // 1️⃣ users
      await setDoc(doc(db, "users", createdUser.uid), {
        nama: user.nama,
        email: user.email,
        lembaga: user.lembaga,
        role: "admin",
        created_at: serverTimestamp(),
      });

      // 2️⃣ data_spesifik ✅ (BARU)
      await setDoc(doc(db, "data_spesifik", createdUser.uid), {
        uid: createdUser.uid,
        nama: user.nama,
        email: user.email,
        lembaga: user.lembaga,
        nrp: user.nrp || "",
        jenis_kelamin: user.jenis_kelamin || "",
        ttl: user.ttl || "",
        cabang: user.cabang || "",
        kta: user.kta || "",
        lspsn: user.lspsn || "",
        id_tingkatan: user.id_tingkatan || null,
        foto: user.foto || "",
        role: "admin",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // 3️⃣ hapus pending
      await deleteDoc(doc(db, "pending_users", user.id));

      // 4️⃣ email
      await sendEmail(
        user.email,
        user.nama,
        "Akun admin Anda telah diterima. Silakan login.",
        true
      );

      showLoader("success");
    } catch (err) {
      console.error(err);
      showLoader("error", "Gagal menyetujui akun");
    }
  };

  // ❌ Fungsi Tolak
  const handleReject = async () => {
    const user = confirmModal.user;
    if (!user) return;
    setConfirmModal({ show: false, type: "", user: null });
    showLoader("loading", "Menolak akun admin...");

    try {
      await fetch("https://project-kesehatan.vercel.app/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: user.public_id,
          resource_type: user.resource_type,
        }),
      });

      await deleteDoc(doc(db, "pending_users", user.id));
      await sendEmail(
        user.email,
        user.nama,
        "Maaf, pendaftaran akun admin Anda ditolak.",
        false
      );
      showLoader("success");
    } catch (err) {
      console.error(err);
      showLoader("error", "Gagal menolak akun");
    }
  };

  const sendEmail = (toEmail, toName, message, accepted = false) => {
    return emailjs.send(
      "service_dip11ah",
      "template_57sbswo",
      {
        to_email: toEmail,
        to_name: toName,
        title: accepted ? "Akun Anda Telah Diterima" : "Akun Anda Ditolak",
        message: message,
        accepted: accepted,
        year: new Date().getFullYear(),
        login_button: accepted
          ? `<a href="project-kesehatan-56b4b.web.app/login" class="button">Login Sekarang</a>`
          : "",
      },
      "koKUzXhOxQy0j5CBc"
    );
  };

  const filteredUsers = pendingUsers.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword)
    );
  });

  const showLoader = (status = "loading", message = "") => {
    setLoader({
      visible: true,
      status,
      message,
    });
  };

  // 👁️ Fungsi Lihat Detail
  const handleView = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {loader.visible && (
        <FullScreenLoader status={loader.status} message={loader.message} />
      )}

      {/* Sidebar */}
      <div className="md:block fixed top-0 left-0">
        <Sidebar />
      </div>

      <div className="flex-1 md:ml-64 mt-16 md:mt-14 p-4 md:p-8">
        <h1 className="text-2xl font-bold text-green-600 mb-6 text-center md:text-left">
          Daftar Akun Pending
        </h1>

        <input
          type="text"
          placeholder="Cari nama atau email..."
          className="border rounded px-4 py-2 mb-4 w-full md:w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64 text-green-600">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <p className="text-gray-500 text-center">Tidak ada akun pending.</p>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredUsers}
              pagination
              highlightOnHover
              responsive
              progressPending={loading}
            />
          </div>
        )}
      </div>

      {/* 🔹 Modal Detail User */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative p-6 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-green-600 mb-4">
              Detail Akun Pending
            </h2>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Nama:</strong> {selectedUser.nama}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Lembaga:</strong> {selectedUser.lembaga}
              </p>
              <p>
                <strong>Tingkatan:</strong> {selectedUser.nama_tingkatan}
              </p>
              <p>
                <strong>NRP:</strong> {selectedUser.nrp}
              </p>
              <p>
                <strong>Jenis Kelamin:</strong> {selectedUser.jenis_kelamin}
              </p>
              <p>
                <strong>Tempat, Tanggal Lahir:</strong> {selectedUser.ttl}
              </p>
              <p>
                <strong>Cabang:</strong> {selectedUser.cabang}
              </p>
              <p>
                <strong>KTA:</strong> {selectedUser.kta}
              </p>
              <p>
                <strong>LSPSN:</strong> {selectedUser.lspsn}
              </p>

              {selectedUser.foto && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Foto:</p>
                  <img
                    src={selectedUser.foto}
                    alt="Foto User"
                    className="w-48 h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* 🔘 Tombol aksi dalam modal */}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.type === "accept" ? "Terima Akun" : "Tolak Akun"}
        message={
          confirmModal.type === "accept"
            ? `Apakah kamu yakin ingin menerima akun ${confirmModal.user?.nama}?`
            : `Apakah kamu yakin ingin menolak akun ${confirmModal.user?.nama}?`
        }
        onCancel={() => setConfirmModal({ show: false, type: "", user: null })}
        onConfirm={() => {
          confirmModal.type === "accept" ? handleAccept() : handleReject();
        }}
      />
      <AcceptAccountModal
        show={acceptModal.show}
        user={acceptModal.user}
        role="admin"
        onCancel={() => setAcceptModal({ show: false, user: null })}
        onConfirm={handleAccept}
      />
    </div>
  );
};

export default ConfirmAccount;
