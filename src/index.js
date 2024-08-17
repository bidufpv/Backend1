import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";


dotenv.config({path: './env'});
connectDB();









// // const DB_NAME = "myVideo";
// import express from "express";
// const app = express();
// const port = process.env.PORT;

// (async()=>{
//     try {
//         mongoose.connect(`${process.env.MONGO}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("Error:", error);
//             throw error;
//         })

//         app.listen(port, ()=>{
//             console.log(`Server is listening on Port ${port}`);
            
//         })

//     } catch (error) {
//         console.log("Error:", error);
//         throw error;
//     }
// })()