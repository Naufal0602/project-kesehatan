import React, { useEffect, useState } from "react";
import { auth, db } from "../../../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import SidebarUser from "../../../components/sidebar_user";
import { Link } from "react-router-dom";

export default function UserProfile() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, "data_spesifik", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setUserData(snap.data());
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarUser />

      <div className="lg:ml-64 mt-14 p-8 w-full">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">

          <h1 className="text-2xl font-bold mb-6 text-center">Profil Saya</h1>

          {!userData ? (
            <p className="text-center">Memuat data...</p>
          ) : (
            <>
              {/* FOTO PROFIL */}
              <div className="flex justify-center mb-6">
                <img
                  src={userData.foto || "https://via.placeholder.com/150"}
                  className="w-32 h-32 rounded-full object-cover border"
                  alt="foto profil"
                />
              </div>

              {/* DATA */}
              <div className="space-y-2 text-left">
                <p><strong>Nama:</strong> {userData.nama}</p>
                <p><strong>Jenis Kelamin:</strong> {userData.jenis_kelamin}</p>
                <p><strong>NRP:</strong> {userData.nrp}</p>
                <p><strong>KTA:</strong> {userData.kta}</p>
                <p><strong>LSPN:</strong> {userData.lspsn}</p>
                <p><strong>TTL:</strong> {userData.ttl}</p>
              </div>

              {/* TOMBOL EDIT */}
              <Link
                to="/user/profile/edit_profil"
                className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full text-center"
              >
                Edit Profil
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
