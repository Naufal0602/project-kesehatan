import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user'); // Hapus data dari localStorage
      navigate('/login'); // Arahkan ke login page
    } catch (error) {
      console.error('Logout gagal:', error);
      alert('Terjadi kesalahan saat logout.');
    }
  };

  return (
 <button
  className="bg-white w-full py-3 text-xl rounded-lg text-green-500 hover:bg-gray-200 transition duration-300 ease-in-out transform hover:scale-105"
  onClick={handleLogout}>
  Logout
</button>

  );
};

export default LogoutButton;
