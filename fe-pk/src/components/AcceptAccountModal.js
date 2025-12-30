import React from "react";
import { CheckCircle, X } from "lucide-react";

const AcceptAccountModal = ({ show, user, role, onConfirm, onCancel }) => {
  if (!show || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-lg p-6 animate-fadeIn">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 text-green-600 mb-3">
          <CheckCircle />
          <h2 className="text-lg font-semibold">Setujui Akun</h2>
        </div>

        <p className="text-gray-700 mb-4">
          Kamu akan menyetujui akun berikut:
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <p><strong>Nama:</strong> {user.nama}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p>
            <strong>Role:</strong>{" "}
            <span className="capitalize font-semibold text-green-600">
              {role}
            </span>
          </p>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          Akun akan langsung aktif dan bisa login setelah disetujui.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Setujui Akun
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptAccountModal;
