import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HeartPulse, LibraryBig, House, ChevronDown } from "lucide-react";
import LogoutButton from "./logout_button";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const Sidebar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [userPhoto, setUserPhoto] = useState(null);
  const location = useLocation();

  const menuItems = [
    { to: "/user/dashboard", label: "Dashboard", icon: <House /> },
    { to: "/user/materi", label: "Data Materi", icon: <LibraryBig /> },
    { to: "/user/penyakit", label: "Data Penyakit", icon: <HeartPulse /> },
    { to: "/user/data_umum/index", label: "Data Umum", icon: <HeartPulse /> },
  ];

  // 🔹 Ambil nama dan foto user dari Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Ambil nama dari koleksi users
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        let nama = user.displayName || "Admin";

        if (userSnap.exists()) {
          nama = userSnap.data().nama || nama;
        }

        setUserName(nama);

        // Ambil foto dari koleksi data_spesifik berdasarkan user_id
        const q = query(
          collection(db, "data_spesifik"),
          where("user_id", "==", user.uid)
        );
        const spesifikSnap = await getDocs(q);

        if (!spesifikSnap.empty) {
          const data = spesifikSnap.docs[0].data();
          if (data.foto) {
            // kalau foto berupa object { url, public_id }, ambil url-nya
            setUserPhoto(typeof data.foto === "object" ? data.foto.url : data.foto);
          }
        }
      } catch (error) {
        console.error("Gagal ambil data user:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div>
      {/* Navbar atas */}
      <div className="fixed top-0 left-0 h-14 w-full lg:w-[calc(100%-16rem)] lg:ml-64 bg-green-600 flex items-center z-40">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-white text-3xl font-bold p-4 lg:hidden focus:outline-none"
        >
          ☰
        </button>
        <h1 className="text-white text-3xl font-bold p-4 dynapuff">MoveOn</h1>

        {/* Tombol dropdown nama user */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-white p-4 ml-auto flex items-center gap-2 rounded-md transition hover:bg-green-700"
        >
          {userName}
          <ChevronDown
            className={`transition-transform duration-300 ${
              showMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown logout */}
        <div
          className={`absolute right-4 top-14 bg-white rounded-md shadow-lg w-40 overflow-hidden transform transition-all duration-300 ease-out origin-top z-50 ${
            showMenu
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          <LogoutButton />
        </div>
      </div>

      {/* Sidebar untuk desktop */}
      <div className="hidden lg:block fixed w-64 h-screen bg-green-500 text-white z-30">
        <div className="flex flex-col items-center gap-4 py-8">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Foto Profil"
              className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="bg-white rounded-full w-40 h-40 flex items-center justify-center text-green-600 font-bold text-2xl">
              {userName?.charAt(0) || "A"}
            </div>
          )}
          <h2 className="text-4xl font-bold mb-6 dynapuff">MOVEON</h2>
        </div>

        <div className="flex flex-col">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`w-full p-2 flex items-center gap-4 pl-4 transition duration-300 group ${
                  isActive
                    ? "bg-green-400 font-bold"
                    : "hover:bg-green-400 hover:font-bold"
                }`}
              >
                <div
                  className={`transition duration-300 ${
                    isActive ? "stroke-[2.5]" : "group-hover:stroke-[2.5]"
                  }`}
                >
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Overlay mobile */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* Sidebar mobile */}
      <div
        className={`fixed top-14 left-0 w-64 h-[calc(100vh-3.5rem)] bg-green-500 text-white transform transition-transform duration-300 ease-in-out z-30 lg:hidden ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center gap-4 py-6">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Foto Profil"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="bg-white rounded-full w-32 h-32 flex items-center justify-center text-green-600 font-bold text-2xl">
              {userName?.charAt(0) || "A"}
            </div>
          )}
          <h2 className="text-3xl font-bold mb-4 dynapuff">MOVEON</h2>
        </div>

        <div className="flex flex-col">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setShowSidebar(false)}
                className={`w-full p-2 flex items-center gap-4 pl-4 transition duration-300 group ${
                  isActive
                    ? "bg-green-400 font-bold"
                    : "hover:bg-green-400 hover:font-bold"
                }`}
              >
                <div
                  className={`transition duration-300 ${
                    isActive ? "stroke-[2.5]" : "group-hover:stroke-[2.5]"
                  }`}
                >
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
