// src/TestUpload.js
import { useState } from "react";
import axios from "axios";

export default function TestUpload() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://localhost:3030/upload", formData);
    setUrl(res.data.url);
  };

  return (
    <div style={{ padding: 40 }}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      {url && (
        <div>
          <p>Uploaded:</p>
          <img src={url} alt="uploaded" width="200" />
        </div>
      )}
    </div>
  );
}
