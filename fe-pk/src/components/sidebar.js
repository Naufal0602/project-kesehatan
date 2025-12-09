import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Layers,
  Users,
  ClockFading,
  HeartPulse,
  LibraryBig,
  House,
  ChevronDown,
  ClipboardList
} from "lucide-react";

import LogoutButton from "./logout_button";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Sidebar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [adminName, setAdminName] = useState("Admin");
  const [adminPhoto, setAdminPhoto] = useState(null);

  const location = useLocation();

  const menuItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: <House /> },
    { to: "/admin/data_umum/index", label: "Data Umum", icon: <ClipboardList /> },
    { to: "/admin/data_materi/index", label: "Data Materi", icon: <LibraryBig /> },
    { to: "/admin/data_penyakit/index", label: "Data Penyakit", icon: <HeartPulse /> },
    { to: "/admin/data_penyakit/data_antisipasi", label: "Data Antisipasi", icon: <HeartPulse /> },
    { to: "/admin/tingkatan", label: "Tingkatan", icon: <Layers /> },
    { to: "/admin/daftar-account", label: "Daftar Akun Pengguna", icon: <Users /> },
    { to: "/admin/confirm-account", label: "Daftar Akun Tertunda", icon: <ClockFading /> },
  ];

  // 🔥 AMBIL DATA ADMIN DARI FIRESTORE
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const ref = doc(db, "users", currentUser.uid);
          const snap = await getDoc(ref);

          const q = query(
            collection(db, "data_spesifik"),
            where("user_id", "==", currentUser.uid)
          );
          const spesifikSnap = await getDocs(q);

          if (!spesifikSnap.empty) {
            const data = spesifikSnap.docs[0].data();
            if (data.foto) {
              setAdminPhoto(
                typeof data.foto === "object" ? data.foto.url : data.foto
              );
            }
          }

          if (snap.exists()) {
            const data = snap.data();

            setAdminName(data.nama || "Admin");

            
          }
        } catch (err) {
          console.error("Gagal load admin:", err);
        }
      }
    });

    return () => unsub();
  }, []);

  return (
    <div>
      {/* NAVBAR */}
      <div className="fixed top-0 left-0 h-14 w-full lg:w-[calc(100%-16rem)] lg:ml-64 bg-green-600 flex items-center z-40">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-white text-3xl font-bold p-4 lg:hidden"
        >
          ☰
        </button>

        <h1 className="text-white text-3xl font-bold p-4 dynapuff">MoveOn</h1>

        {/* ADMIN DROPDOWN */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-white p-4 ml-auto flex items-center gap-2"
        >
          {adminName}
          <ChevronDown
            className={`transition-transform duration-300 ${
              showMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* DROPDOWN CONTENT */}
        <div
          className={`absolute right-4 top-14 bg-white rounded-md shadow-lg w-40 transform transition-all duration-300 origin-top z-50 ${
            showMenu
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <LogoutButton />
          <Link to="/admin/profile/user_profil">
                      <button
                        className="bg-white w-full py-3 text-xl rounded-lg text-green-500 
                         hover:bg-gray-200 transition duration-300 ease-in-out 
                         transform hover:scale-105"
                      >
                        Profil
                      </button>
                    </Link>
        </div>
      </div>

      {/* SIDEBAR DESKTOP */}
      <div className="hidden lg:block fixed w-64 h-screen bg-green-500 text-white z-30">
        <div className="flex flex-col items-center gap-4 py-8">
          {adminPhoto ? (
            <img
              src={adminPhoto}
              className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-md"
              alt="Foto Admin"
            />
          ) : (
            <div className="bg-white w-40 h-40 rounded-full flex items-center justify-center text-green-600 text-3xl font-bold">
              {adminName.charAt(0)}
            </div>
          )}

          <h2 className="text-4xl font-bold mb-6 dynapuff">MOVEON</h2>
        </div>

        <div className="flex flex-col">
          {menuItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`w-full p-2 flex items-center gap-4 pl-4 transition group ${
                  active ? "bg-green-400 font-bold" : "hover:bg-green-400"
                }`}
              >
                <div className={`${active ? "stroke-[2.5]" : ""}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* OVERLAY MOBILE */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* SIDEBAR MOBILE */}
      <div
        className={`fixed top-14 left-0 w-64 h-[calc(100vh-3.5rem)] bg-green-500 text-white transform transition-all duration-300 z-30 lg:hidden ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          {adminPhoto ? (
            <img
              src={adminPhoto}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
              alt="foto"
            />
          ) : (
            <div className="bg-white w-32 h-32 rounded-full flex items-center justify-center text-green-600 text-2xl font-bold">
              {adminName.charAt(0)}
            </div>
          )}
          <h2 className="text-3xl font-bold dynapuff">MOVEON</h2>
        </div>

        <div className="flex flex-col">
          {menuItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setShowSidebar(false)}
                className={`w-full p-2 flex items-center gap-4 pl-4 transition group ${
                  active ? "bg-green-400 font-bold" : "hover:bg-green-400"
                }`}
              >
                <div className={`${active ? "stroke-[2.5]" : ""}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
