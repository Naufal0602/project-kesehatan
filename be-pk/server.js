import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Konfigurasi multer (untuk upload file sementara di memori)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint upload
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Tidak ada file dikirim" });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "react_uploads" }, // opsional: folder di Cloudinary
      (error, result) => {
        if (error) return res.status(500).json({ error });
        res.json({ url: result.secure_url });
      }
    );

    uploadStream.end(file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.listen(process.env.PORT || 3030, () =>
  console.log(`✅ Server berjalan di http://localhost:${process.env.PORT || 3030}`)
);
