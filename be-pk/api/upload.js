import multer from "multer";
import cloudinary from "./cloudinary";

const upload = multer({
  storage: multer.memoryStorage(),
});

export const config = {
  api: {
    bodyParser: false, // WAJIB untuk multer
  },
};

export default function handler(req, res) {
  // ===== CORS =====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  upload.single("file")(req, res, async (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    try {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "react_uploads",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary error:", error);
            return res.status(500).json({ error: error.message });
          }

          return res.status(200).json(result);
        }
      );

      stream.end(req.file.buffer);
    } catch (e) {
      console.error("❌ Upload crash:", e);
      return res.status(500).json({ error: e.message });
    }
  });
}
