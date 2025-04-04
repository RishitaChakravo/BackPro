import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js"

dotenv.config({
    path : './.env'
})

//Second Approach
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running at port:${process.env.PORT}`)
    })

    app.on("error", (error) => {
        console.log("ERRR: ", error)
        throw error
    })
})
.catch((error) => {
    console.log(`MongoDB connection failed!!!`, error)
    process.exit(1)
})












//Fist Approach
// import express from "express"
// const app = express();

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.
//         MONGODB_URL}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("ERRR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             cpnsole.log(`app is lsitening at ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("Error:", error)
//     }
// })()

