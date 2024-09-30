import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from 'express';
import app from './app.js'

// const app = express();

const port = process.env.PORT
dotenv.config({path: './.env'});
connectDB().then(
()=>{
    app.listen(process.env.PORT || 4000, ()=>{
        console.log(`Server is listening on ${port}`);
        
    })
}
).catch((err)=>{
    console.log("Error in connecting Mongodb", err);
    
})









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