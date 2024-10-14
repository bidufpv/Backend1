import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';

// utility middleware
// asyncHandler is wrapped for handling errors
export const verifyJWT = asyncHandler( async(req, res, next)=>{
   //req.cookies?.accessToken checks if the cookie is avaliable
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    //req.header("Authorization")?.replace("Bearer ", "") checks the Authorization
    // header of the http request, If the token is in the Authorization header, 
    //it's expected to have the format Bearer <token>. 
    //The code strips the "Bearer " part and retrieves the raw token value.
   
    if(!token){
        throw new ApiError(401, "Unauthorized Request")
    }
    
    //jwt.verify for veryifying/decoding the token we got
   const decodedJwtToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

   await 
})