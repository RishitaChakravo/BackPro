import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken};

    } catch ( error ) {
        throw new ApiError(500, "Something wend wrong while generating and refresh token");
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const {fullname, username, email, password} = req.body
    
    if(
        [fullname, email, password, username].some((field) => 
            field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    if(!email.includes("@")){
        throw new ApiError(400, "Email invalid")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already existed")
    }

    if (!req.files || !req.files["avatar"]) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverimageLocalPath = req.files?.coverimage[0]?.path;

    let coverimageLocalPath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverimageLocalPath = req.files.coverimage[0].path;
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar || !avatar.url) {
        throw new ApiError(500, "Failed to upload avatar");
    }
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)
    
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname, 
        avatar : avatar.url,
        coverimage : coverimage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered succesfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    // req.body -> data
    //data enter fields like username and password
    //check whtether user is signed up
    //check if all fields are filled or not
    //check whether correct data entered : username and password req.body se mangenge
    //use method is password correct for password checking
    //create an access token and refresh token
    //send cookies

    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "Enter Username or Email");
    }

    const user = await User.findOne({
        $or : [ {username}, {email} ]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exist, Register User first")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await user.findById(user._id).
    select("-password -refreshToken")

    const option = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User Logged In Succesfully!!"
        )
    )

})

const logoutUser = asyncHandler( async function(req, res){
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $unset : { refreshToken: 1}
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))  
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(400, "Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassWord, newPassword, confPassword} = req.body;

    if (!(newPassword === confPassword)) {
        throw new ApiError(400, "Confirm password again");
    }
    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassWord)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed sucecsfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    if(
        [fullname, email].some((field) => 
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {
                fullname : fullname,
                email : email
            }
        },
        {
            new : true
        }
    ).select("-password")

    user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, user , "Account details updated Updated Successfully")
    )

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is missing")
    }

    const avatar = await  uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {avatar : avatar.url}
        },
        {new : true}
    ).select("-password")

    user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverimageLocalPath = req.file?.path

    if(!coverimageLocalPath) {
        throw new ApiError(400, "Cover File is missing")
    }

    const coverimage = await  uploadOnCloudinary(avatarLocalPath)

    if(!coverimage.url) {
        throw new ApiError(400, "Error while uploading an image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {coverimage : coverimage.url}
        },
        {new : true}
    ).select("-password")

    user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Missing Username");
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "subscribers"
                },
                channelSubscribedToCount: {
                    $size : "subscribedTo"
                },
                isSubscribedTo : {
                    $cond : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isSubscribedTo : 1,
                avatar : 1,
                coverimage : 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Succesfully extracted the profile"))
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user, "WatchHistory fetched successfully"))
})

export {registerUser,
        loginUser,
        logoutUser, 
        refreshAccessToken, 
        changeCurrentPassword, 
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getProfile,
        getWatchHistory
    }

