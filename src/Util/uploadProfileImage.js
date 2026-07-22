/**
 * Uploads a file to Cloudinary using pre‑signed data from the API.
 *
 * @param {File} image – file object to upload
 * @param {{cloudName:string, apiKey:string, timestamp:number, signature:string, folder:string}} signatureData
 * @returns {Promise<string>} secure URL returned by Cloudinary
 */
const uploadProfileImage = async (image, signatureData) => {
    if (!signatureData?.cloudName) {
        throw new Error('uploadProfileImage called without cloudName in signatureData');
    }

    const formData = new FormData();
    formData.append('file', image);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp);
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

    try{
        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData,
        });
        if(!response.ok){
            const errorData = await response.json();
            throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('Image uploaded successfully', data);
        return data.secure_url;
    }catch(error){
        console.error("Error uploading image to Cloudinary", error);
        throw error;
    }
};
export default uploadProfileImage;