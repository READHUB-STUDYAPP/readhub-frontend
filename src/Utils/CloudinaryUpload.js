import axios from "axios";
import { backendApi } from "../services/api";

/**
 * Object-storage upload (MinIO / S3-compatible), via a backend-issued presigned
 * PUT URL. Replaces the old Cloudinary signed-upload. Export names are kept so
 * existing imports (FileContext, Profile) don't change.
 */

// Backend book-file route caps uploads at 100MB.
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const formatBytes = (bytes) => {
  const b = Number(bytes || 0);
  if (!Number.isFinite(b) || b <= 0) return "0B";
  const mb = b / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)}MB`;
};

const extOf = (name = "", contentType = "") =>
  (name.includes(".") ? name.split(".").pop() : contentType.split("/")[1] || "bin")
    .toLowerCase();

// Convert a data URL (data:image/png;base64,....) or Blob/File to a Blob.
const toBlob = (input) => {
  if (input instanceof Blob) return input;
  if (typeof input === "string" && input.startsWith("data:")) {
    const [meta, b64] = input.split(",");
    const contentType = meta.slice(5, meta.indexOf(";")) || "application/octet-stream";
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: contentType });
  }
  throw new Error("Unsupported upload input");
};

// PUT a blob/file straight to storage using the presigned URL.
const putToStorage = async (uploadUrl, body, contentType, onProgress) => {
  await axios.put(uploadUrl, body, {
    headers: { "Content-Type": contentType },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
};

/** Upload a book file (pdf/doc/…) and return its public URL. */
export const uploadToCloudinary = async (
  file,
  _folder = "documents",
  _resourceType = "raw",
  onProgress = null,
) => {
  if (file?.size && file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File is ${formatBytes(file.size)}. Max upload is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    );
  }
  const contentType = file?.type || "application/octet-stream";
  const ext = extOf(file?.name, contentType);
  const { uploadUrl, publicUrl } = await backendApi.getCloudinarySignature({ ext, contentType });
  await putToStorage(uploadUrl, file, contentType, onProgress);
  return { url: publicUrl };
};

/** Upload a cover image (data URL or Blob) and return its public URL. */
export const uploadCoverToCloudinary = async (image, _folder = "covers") => {
  const blob = toBlob(image);
  const contentType = blob.type || "image/jpeg";
  const ext = extOf("", contentType);
  const { uploadUrl, publicUrl } = await backendApi.getCoverSignature({ ext, contentType });
  await putToStorage(uploadUrl, blob, contentType, null);
  return { url: publicUrl };
};

/** Deletion is handled server-side (no-op client shim, kept for import compatibility). */
export const deleteFromCloudinary = async () => true;
