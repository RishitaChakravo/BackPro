import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    id : {
        type : String
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email : {
        type: String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type: String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type: String,
        required : true,
    },
    coverimage : {
        type: String,
    },
    password : {
        type : String,
        required : [true, 'Password is required'],
    },
    refreshToken : {
        type: String,
    },
    createdAt : {
    },
    updatedAt : {
    }

}, {timestamps : true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10) //hashing of password
    next()
}) //pre middleware before saving the userdata we do a functionality

userSchema.methods.isPasswordCorrect = async function 
(password){
    return await bcrypt.compare(password, this.password) //compare password withh the entered password
}

userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
        { //payload
            _id : this.id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET, 
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id : this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)