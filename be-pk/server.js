// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: "react_uploads" },
      (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        // Kirim balik url dan public_id
        res.json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadResult.end(file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Hapus foto dari Cloudinary
app.delete("/delete", async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: "public_id wajib diisi" });

    const result = await cloudinary.uploader.destroy(public_id);
    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Gagal hapus foto:", err);
    res.status(500).json({ error: "Gagal hapus foto" });
  }
});

app.listen(3030, () => console.log("Server running on port 3030"));
