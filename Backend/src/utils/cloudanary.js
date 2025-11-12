import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

 // Configuration
cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
         api_secret: process.env.CLOUDINARY_API_SECRET
   });

   /*
(async function () {

   

    // Upload an image
    const uploadResult = await cloudinary.uploader
        .upload(
            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
            public_id: 'shoes',
        }
        )
        .catch((error) => {
            console.log(error);
        });

    console.log(uploadResult);

    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url('shoes', {
        fetch_format: 'auto',
        quality: 'auto'
    });

    console.log(optimizeUrl);

    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url('shoes', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });

    console.log(autoCropUrl);
})();
*/

const uploadCloudinary = async (filePath) => {
    console.log("Uploading to Cloudinary:", filePath);
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(400).json(new ApiError(400, "File path is required or file does not exist"));
        }

        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto', // Automatically detect the resource type (image/video)
        });
        fs.unlinkSync(filePath); // Clean up the file after upload
        // Return the result containing the URL and other details
        return result;
    } catch (error) {
        fs.unlinkSync(filePath); // Clean up the file if it exists
        console.error("Cloudinary Upload Error:", error);
        throw error; // Re-throw the error for further handling
    }
}

const deleteCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) {
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