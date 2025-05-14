import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
//config : setup details which needed by the application to run
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
//fs : file system
const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })

        //file has been uploaded successful
        //console.log("File uploaded on cloudinary", response.url);
        
        fs.unlinkSync(localFilePath);//after successful upload
        return response;

    } catch (error) {
        //even if not uploaded it should be removed from temporary storage
        fs.unlinkSync(localFilePath) //remove the locallysaved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}