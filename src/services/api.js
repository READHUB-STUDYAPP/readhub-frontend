import axios from "axios";

import { installAuthHandling } from "../Util/authHandling";

const API_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * The books, profile and reading-stats client.
 *
 * This instance used to sign the reader out on any 401 -- clearing the token
 * and sending them to /login without attempting a refresh. An access token
 * lives fifteen minutes, so a quarter of an hour into any session the next
 * call through here threw them out, while the refresh cookie in their browser
 * would have renewed it.
 *
 * It takes the same policy as the other instance now. It also carries
 * credentials, without which the refresh cookie is not sent at all.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

installAuthHandling(api);

export const backendApi = {
  // Returns a presigned PUT { uploadUrl, publicUrl, method, contentType, key }.
  getCloudinarySignature: async (params = {}) => {
    const response = await api.get("/api/cloudinary-signature/pdf", { params });
    return response.data;
  },

  getCoverSignature: async (params = {}) => {
    const response = await api.get("/api/cloudinary-signature/image", { params });
    return response.data;
  },

  saveBook: async (bookData) => {
    const response = await api.post("/api/book/upload", bookData);
    return response.data;
  },

  getBooks: async () => {
    const response = await api.get("/api/book");
    return response.data;
  },

  deleteBook: async (bookId) => {
    const response = await api.delete(`/api/book/${bookId}`);
    return response.data;
  },

  updateProgress: async (bookId, page) => {
    const response = await api.put(`/api/book/${bookId}`, {
      lastPageRead: page,
      status: "reading",
    });
    return response.data;
  },

  uploadBookFile: async (file, onProgress = null) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/book/upload-file", formData, {
      // Let the browser set the multipart boundary; setting Content-Type manually can break uploads.
      onUploadProgress: (evt) => {
        if (!onProgress) return;
        const total = Number(evt.total || 0);
        const loaded = Number(evt.loaded || 0);
        if (!Number.isFinite(total) || total <= 0) return;
        const percent = Math.round((loaded / total) * 100);
        onProgress(percent);
      },
    });
    return response.data;
  },
};

export default api;
