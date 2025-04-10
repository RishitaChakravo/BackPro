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
        throw new ApiError(404, "User doesn't exist, Rgeister User first")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateRefreshToken(user._id);

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
            $set : { refreshToken: undefined}
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

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user) {
        throw new ApiError(400, "Invalid refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken)
})
export {registerUser, loginUser, logoutUser}

// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res