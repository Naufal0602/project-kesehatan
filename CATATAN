// /api/index.js
import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ENV
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// CORS WAJIB LENGKAP
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// ========================== UPLOAD ==========================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Tidak ada file" });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "react_uploads", resource_type: "auto" },
      (error, result) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json(result);
      }
    );

    uploadStream.end(file.buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========================== DELETE ==========================
app.delete("/delete", async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;

    if (!public_id)
      return res.status(400).json({ error: "public_id wajib diisi" });

    const type = ["image", "video", "raw"].includes(resource_type)
      ? resource_type
      : "raw";

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: type,
    });

    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export (WAJIB untuk Vercel)
export default app;
