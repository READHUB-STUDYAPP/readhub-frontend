import axios from "axios";
import { backendApi } from "../services/api";

/**
 * Upload file to cloudinary using signed upload
 */

// Cloudinary plan limit (current project): 10MB per upload for raw files.
// This limit is enforced by Cloudinary and cannot be bypassed without upgrading the plan
// or using a different storage provider.
const MAX_CLOUDINARY_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const formatBytes = (bytes) => {
  const b = Number(bytes || 0);
  if (!Number.isFinite(b) || b <= 0) return "0B";
  const mb = b / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)}MB`;
};

export const uploadToCloudinary = async (
  file,
  folder = "documents",
  resourceType = "raw",
  onProgress = null,
) => {
  try {
    if (file?.size && file.size > MAX_CLOUDINARY_UPLOAD_BYTES) {
      throw new Error(
        `File is ${formatBytes(file.size)}. This project’s current Cloudinary upload limit is ${formatBytes(MAX_CLOUDINARY_UPLOAD_BYTES)}. Please upload a smaller file or upgrade the Cloudinary plan.`,
      );
    }

    const signatureData = await backendApi.getCloudinarySignature();

    const {
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder: uploadFolder,
      allowed_formats,
      resource_type,
    } = signatureData;

    console.log("Uploading file to Cloudinary...");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    // Create form data for Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", uploadFolder);
    formData.append("allowed_formats", allowed_formats);
    formData.append("resource_type", "raw");

    console.log("FormData:", Object.fromEntries(formData.entries()));

    const response = await axios.post(cloudinaryUrl, formData, {
      onUploadProgress: (ProgressEvent) => {
        if (onProgress && ProgressEvent.total) {
          const percent = Math.round(
            (ProgressEvent.loaded / ProgressEvent.total) * 100,
          );
          onProgress(percent);
        }
      },
    });

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
      resourceType: response.data.resource_type,
      format: response.data.format,
      bytes: response.data.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    if (error.response) {
      // Server responded with error
      throw new Error(
        error.response.data?.error?.message ||
          `Upload failed: ${error.response.status}`,
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error("No response from server");
    } else {
      // Other errors
      throw error;
    }
  }
};

/**
 * Upload cover image to cloudinary
 */
export const uploadCoverToCloudinary = async (
  base64Image,
  folder = "documents",
) => {
  try {
    const signatureData = await backendApi.getCoverSignature(folder);

    const {
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder: uploadFolder,
    } = signatureData;

    console.log("Uploading cover to cloudinary...");

    const formData = new FormData();
    formData.append("file", base64Image);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp);
    formData.append("api_key", apiKey);
    formData.append("folder", uploadFolder || folder);

    console.log(signatureData);
    console.log("FormData:", Object.fromEntries(formData.entries()));

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    console.log(cloudinaryUrl);
    if (!response.ok) {
      const error = await response.text();
      console.error("Cloudinary error:", error);
      throw new Error(`Cover upload failed: ${response.status}`);
    }

    const result = await response.json();

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Error during Cloudinary cover upload:", error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  try {
    // Your backend should handle deletion
    // This is just a reference - actual deletion should be done server-side
    console.log("Deleting from Cloudinary:", publicId);

    // Call your backend to delete
    // Backend will use: cloudinary.uploader.destroy(publicId, { resource_type: resourceType })

    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};
