// /api/index.js
import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Gunakan memory storage (tanpa simpan file lokal)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==================================================
// 🔸 Upload ke Cloudinary
// ==================================================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Tidak ada file yang diupload" });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "react_uploads",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          return res.status(500).json({ error: error.message });
        }

        res.json({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
        });
      }
    );

    uploadStream.end(file.buffer);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 🔸 Hapus file dari Cloudinary
// ==================================================
app.delete("/delete", async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;
    if (!public_id) return res.status(400).json({ error: "public_id wajib diisi" });

    const validTypes = ["image", "video", "raw"];
    const type = validTypes.includes(resource_type) ? resource_type : "raw";

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: type,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary gagal hapus file: ${result.result}`);
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Gagal hapus file:", err);
    res.status(500).json({ error: "Gagal hapus file" });
  }
});

// ==================================================
// 🧩 Export handler untuk Vercel
// ==================================================
export default app;
