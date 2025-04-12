import mongoose, {Schema} from "mongoose";
import { User } from "./user.models";

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    createdAt : {
    },
    updatedAt : { 
    }
}, {timestamps : true})

export const Subscription = mongoose.model("Sunscription", subscriptionSchema)