import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema({
    id : {
        type : String,
    },
    videoFile : {
        type : String
    },
    thumbnail : {
        type : String
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    title : {
        type : String,
    },
    description : {
        type : String,
    },
    duration : {
        type : Number,
    },
    views : {
        type : Number,
        default : 0
    },
    isPublished : {
        type : Boolean,
        default : true
    },
    createdAt : {},
    updatedAt : {}
}, {timestamps : true})

videoSchema.plugin(mongooseAggregatePaginate)//divides the number of videos to be shown 
//eg. if there are 1000 videos it will show 10 videos a time

// .plugin() -> used to extend schemas functionality or add reuseable code to the Schema

export const Video = mongoose.model("Video", videoSchema)