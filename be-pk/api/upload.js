const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "react_unsigned"); // pastikan ini nama preset kamu
  form.append("folder", "react_uploads");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dmqehg4y5/auto/upload",
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error("Upload error: " + t);
  }

  const data = await res.json();

  return {
    nama_file: file.name,
    file_url: data.secure_url,
    public_id: data.public_id,
    resource_type: data.resource_type,
    format: data.format,
  };
};
