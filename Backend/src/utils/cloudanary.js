import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
         api_secret: process.env.CLOUDINARY_API_SECRET
   });

 
const uploadCloudinary = async (filePath) => {
    console.log("Uploading to Cloudinary:", filePath);
    try {
        // Validate file path first
        if (!filePath) {
            throw new Error("File path is required");
        }
        
        if (!fs.existsSync(filePath)) {
            throw new Error("File does not exist");
        }

        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto',
        });
        
        // Clean up the file after successful upload
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error("File cleanup failed:", cleanupError.message);
                // Don't throw, just log the cleanup error
            }
        }
        
        return result;
    } catch (error) {
        // Only clean up if file exists and we have a valid filePath
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error("File cleanup failed:", cleanupError.message);
                // Don't throw the cleanup error, preserve the original error
            }
        }
        console.error("Cloudinary Upload Error:", error.message);
        throw error; // Re-throw the original error
    }
}

const deleteCloudinary = async (publicId, resourceType = "image") => {
    try {
        // Enhanced validation to check for whitespace-only strings
        if (!publicId || typeof publicId !== 'string' || publicId.trim().length === 0) {
            throw new Error("Public ID is required for deletion");
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType, 
        });

        return result;
    } catch (error) {
        throw error;
    }
};






export {uploadCloudinary, deleteCloudinary};