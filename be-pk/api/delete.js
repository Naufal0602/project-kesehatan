import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
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

  try {
    const { public_id, resource_type } = req.body || {};

    if (!public_id) {
      return res.status(400).json({ error: "public_id wajib" });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || "image",
    });

    return res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return res.status(500).json({ error: err.message });
  }
}
