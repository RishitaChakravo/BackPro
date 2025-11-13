import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { publishAVideo, updateVideoDetails } from "../controllers/video.controller.js";

const videorouter = Router()

videorouter.route("/publish-video").post(
    upload.fields([
        {
            name : thumbnail,
            maxCount : 1
        },
        {
            name : videoFile,
            maxCount : 1
        }
    ]), publishAVideo
)
videorouter.route("/update").patch(upload.single("thumbnail"), updateVideoDetails)
export default videorouter
