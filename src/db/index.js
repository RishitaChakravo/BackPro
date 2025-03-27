import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
    try{
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Mongoose Connect Succesfully!! DB host : ${connectInstance.connection.host}`)
    } catch(error) {
        console.log(`Mongoose connection FAILED`, error)
        process.exit(1)
    }
}

export default connectDB