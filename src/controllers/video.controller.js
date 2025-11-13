import {Video} from "../models/video.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler( async(req, res) => {
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query
    // sortby : is by what you wish to sort the cideo mostly views
    // sortType : it tell whether it needs to be ascending or descending
    if(
        [query, sortBy, sortType, userId].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(500, "All fields are required");
    }
    const videos = await Video.aggregate([
        {
            $match : {
                owner : userId
            }
        },
        {
            $sort : {
                [sortBy] : sortType === 'asc' ? 1 : -1 //this literally means view : -1(desc)
            }
        },
        {
            $lookup : {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
    ])
    //when pagination is used req.query can be used to get information from the url

    return res
    .status(200)
    .json(
        new ApiError(200, videos, "All videos fetched")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(
        [title, description].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    if(!req.files || !req.files.thumbnail || !req.files.videoFile){
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail || !thumbnail.url){
        throw new ApiError(400, "Thumbnail upload failed")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path

    if(!videoFileLocalPath){
        throw new ApiError(400, "Video file is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if(!videoFile || !videoFile.url){
        throw new ApiError(400, "Failed to upload Video file")
    }

    const video = await Video.create({
        title,
        description,
        thumbnail : thumbnail.url,
        videoFile : videoFile.url
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video is published succesfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId);

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video id fetched")
    )
})

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId, title, description} = req.params
    const thumbnailLocalPath = req.file?.path

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(400, "Video not found")
    }

    if(!thumbnailLocalPath){
        throw new ApiError()
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    //TODO: update video details like title, description, thumbnail
    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set : {
                title : title,
                description : description,
                thumbnail : thumbnail.url
            }
        },
        {
            new : true
        }
    )

    updatedVideo.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video succesfully updated")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(400, "Video not found")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deleteVideo){
        throw new ApiError(400, "Couldnt delete Video");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deleteVideo, "Video is deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(400, "Video not found")
    }

    video.isPublished = !video.isPublished

    video.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video succesfully updated")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    deleteVideo,
    togglePublishStatus
}
