import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const FullScreenLoader = ({ status, message }) => {
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    if (status === "success") {
      setPhase("success");
      const timer = setTimeout(() => {
        window.location.reload(); // 🔁 auto refresh page setelah sukses
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (status === "error") {
      setPhase("error");
      const timer = setTimeout(() => {
        window.location.reload(); // 🔁 auto refresh juga meskipun gagal
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-3 bg-white px-8 py-6 rounded-2xl shadow-lg">
        {phase === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-blue-500" />
            <p className="text-gray-700 font-medium">{message || "Memproses..."}</p>
          </>
        )}

        {phase === "success" && (
          <>
            <CheckCircle size={50} className="text-green-500 animate-bounce" />
            <p className="text-green-600 font-semibold">Berhasil!</p>
          </>
        )}

        {phase === "error" && (
          <>
            <XCircle size={50} className="text-red-500 animate-pulse" />
            <p className="text-red-600 font-semibold">Gagal!</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FullScreenLoader;
