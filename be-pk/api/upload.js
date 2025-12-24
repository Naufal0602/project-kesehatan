import multer from "multer";
import cloudinary from "./cloudinary";

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false, // WAJIB untuk multipart/form-data
  },
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File tidak ada" });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "react_uploads",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.status(200).json(result);
      }
    );

    stream.end(req.file.buffer);
  });
}
