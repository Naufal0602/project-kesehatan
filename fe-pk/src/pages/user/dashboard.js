import React, { useState, useEffect } from "react";
import LogoutButton from "../../components/logout_button";
import SidebarUser from "../../components/sidebar_user";
import { auth, db } from "../../services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


const UserDashboard = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData({ email: currentUser.email });
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 z-50">
        <SidebarUser />
      </div>

      <div className="lg:ml-64 mt-14 p-8 w-full text-center">
        <div className="bg-white p-12 rounded-lg shadow-md inline-block">
          <h1 className="text-2xl font-bold">User Dashboard</h1>
          {userData ? (
            <p>Selamat datang, {userData.nama || userData.email} 👋</p>
          ) : (
            <p>Memuat data pengguna...</p>
          )}
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
