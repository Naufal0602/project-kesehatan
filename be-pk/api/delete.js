import cloudinary from "./cloudinary";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { public_id, resource_type } = req.body;

  if (!public_id) {
    return res.status(400).json({ error: "public_id wajib diisi" });
  }

  const type = ["image", "video", "raw"].includes(resource_type)
    ? resource_type
    : "image";

  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: type,
    });

    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
