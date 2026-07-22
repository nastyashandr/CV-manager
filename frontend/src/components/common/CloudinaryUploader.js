export default class CloudinaryUploader {
  static async upload(file) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !preset) {
      throw new Error('Cloudinary is not configured. Please check .env file.');
    }

    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', preset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body,
        mode: 'cors',
        credentials: 'omit'
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'Image upload failed');
    }

    const data = await res.json();
    return data.secure_url;
  }
}