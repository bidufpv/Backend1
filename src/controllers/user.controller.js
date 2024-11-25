import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {cloudinaryUpload} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
// import { User } from '../models/user.model.js';



// for registering a user
export const registerUser =  asyncHandler( async (req, res)=>{
    // return res.status(200).json({
    //     message: 'Ok'
    // });

    // step-1 get data from user via frontend or via postman
    // step-2 validation on data - shouldnt be empty
    // step-3 checking if user already exists on the database
    // step-4 checking email or username for validation
    // step-5 checking for images as avatar
    // step-6 uploading them into cloudinary
    // step-7 creating user object- create entry in db.
    // step-8 removing password and refresh token from the response.
    // step-9 checking for user creation
    // step-10 return response else error

    const {username, email, fullname, password} = req.body;
   // console.log(username, email, fullname, password);

    // if(username === ''){
    //     throw new ApiError(400, 'fullname is required');
        
    // }
    // Using some method to check the condition
    if([username, fullname, email, password].some((field)=>
    field?.trim() === "")){    // this logic is to check if any of the field that is present in the array are actually empty
         throw new ApiError(400, "All fields are required")
    }

    //console.log(req.files);


    const existingUser = await User.findOne({
        $or : [{password}, {email}] // this or will check values in all those mentioned objects
    });

    if(existingUser){
     throw new ApiError(409,'User with same credentials already exists');
    }
         
    // console.log(req.files); 
    

    const avatarPath = req.files?.avatar[0]?.path;

    if(!avatarPath){
       throw new ApiError(400, "Avatar is Required!")
    
    }
    
    const avatar = await cloudinaryUpload(avatarPath);
    if(!avatar){
        throw new ApiError(400, "Avatar is Required!")
    }
    //console.log(avatar);
    // const coverimagePath = req.files?.coverimage[0]?.path;

    // console.log(avatarPath);
    // console.log(coverimagePath);


    let coverimagePath; // declaring the coverimagepath variable this will let the variable to undefined
    if(req.files && Array.isArray(req.files.coverimage)
    && req.files.coverimage.length > 0)
    //This if condition check if the req.files exist or else it will return undefiend
    //Array.isArray to check wether the req.files.coverimage is an array cuz multer stores files in an a array
    //req.files.coverimage.length>0 just to check if we are getting atleast one file
    {
    coverimagePath = req.files.coverimage[0].path
    // and with this piece of code we can get the path.
    }
    console.log('coverimagepatherror' , coverimagePath);
    
    const coverimage = await cloudinaryUpload(coverimagePath);
    console.log('coverimageerror', coverimage);
    

    
    

   const dbuser = await User.create({
        fullname,
        avatar: avatar.url,
        // coverimage: coverimage?.url || "",
        coverimage: coverimage.url,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(dbuser._id).select(
        "-password -refreshtoken"
    ) //we write what we dont want in this select method with negative sign

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")

    };
     
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered succesfully")
    )

});

// findUserId from db for finidng userId from database.
const generateAccessandRefreshToken = async(findUserId)=>{
    try {
        const user = await User.findOne(findUserId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken; // for adding refresh token to user object
        await user.save({ validateBeforeSave: false }); //no validation before saving

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, 'Something went Wrong!')
    }
}


// for login user
export const loginUser = asyncHandler( async(req, res)=>{
    // Get all the data from req.body
    //check for user either from username or eail
    // find user from the database
    //check password
    //check accessand refresh token
    //send cookie / confirmation

    const {email, username, password} = req.body

     if (!(username || email)) {
        throw new ApiError(400, 'Username or email is required!')

     }
    
     //findUser is the variable name for finding the user from db
     const findUser = await User.findOne({
        $or: [{username}, {email}]
     });

     if(!findUser){
        throw new ApiError(404, "User not found!")
     }

     const isPasswordValid = await findUser.isPasswordCorrect(password)
     if (!isPasswordValid){
        throw new ApiError(401, "Invalid password!")
     }


    const {accessToken, refreshToken} =  await generateAccessandRefreshToken(findUser._id)

    const loggedInUser = await User.findById(findUser._id).select(
        "-password -refreshToken"

    )
    // only server side can change this
    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
     .json(
        //refer apiresponse.js
        new ApiResponse(200, //statuscode
            // data field in the curly braces
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged in succesfully"
        )
     )
})

//for logout user
export const logoutUser = asyncHandler(async(req, res) => {
          
   await User.findByIdAndUpdate(
        req.user._id, { //req.user._id for finding the user
            $set: {     //$set mongo operator for updating fields takes object
                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )

    const options = {
        httpOnly: true,
        secure: true   
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)// clearCookie is coming from cookiesparser
    .clearCookie("refreshToken", options)// clearCookie is coming from cookiesparser
    .json(new ApiResponse(200, {}, "User LoggedOut succesfully"))
    

})

// code snippet for refreshing the acccess token from db
export const accessRefreshToken = asyncHandler(async(req, res, next)=>{
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   
     if(!incomingRefreshToken){
         throw new ApiError(401, "Uauthorized Access!")
     }

     try {
 
   const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
   const user = await User.findById(decodedToken?._id)
   if(!user){
     throw new ApiError(401, "Invalid Refresh Token")
   };
 
   //for checking if the user's incomin refreshtoken is same as the db refreshtoken
   if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, "Refresh Token Unmatched!")
   }
 
   const options ={
     httpOnly: true,
     secure: true
   }
   const {accessToken, newrefreshToken} = await generateAccessandRefreshToken(user._id)
    
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newrefreshToken, options)
   .json(
     new ApiResponse(200,
         {accessToken, refreshToken: newrefreshToken},
         "Access Token refreshed"
     )
   )
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid RefreshToken")
   }
}
);


//for changing password / setting a new password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
   
    console.log("Request Body:", req.body);
    console.log("User ID:", req.user?.id);

    const { oldPassword, newPassword, verifyPassword } = req.body;

    console.log(oldPassword, newPassword, verifyPassword);

    // Use `User` to fetch user and assign it to a variable `currentUser`
    const currentUser = await User.findById(req.user?._id);
    console.log(currentUser);

    if (!currentUser) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await currentUser.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Given Password is Invalid!");
    }

    if (newPassword !== verifyPassword) {
        throw new ApiError(400, "New Passwords do not match!");
    }

    currentUser.password = newPassword;
    await currentUser.save({ validateBeforeSave: false }); //validatebeforsave will not validate the password once again


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully!"));
});


export const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched succesfully")
})


//for updating account details
export const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {email, fullName} = req.body;

    if(!email || !fullName){
        throw new ApiError(400,"email and fullName are mandatory!")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new: true} // returns value after updation
    ).select("-password")
})


//for updating avatar 
export const updateAvatar= asyncHandler(async(req,res)=>{

 const AvatarPath = req.file?._id;

 if(!AvatarPath){
    throw new ApiError(400, "AvatarPath missing!")
 };

 const avatar = await cloudinaryUpload(AvatarPath);

 if(!avatar.url){
    throw new ApiError(400,"Error in uploading Avatar")

 }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }

    },
    {
       new: true
    }
 ).select("-password")


 return res
 .status(200)
 .json(
    new ApiResponse(200,"Avatar updated succesfully")
 )

 

})

//for updating coverImage
export const updateCoverImage = asyncHandler(async(req,res)=>{
    
    const coverImagePath = req.file?._id;
    
    if(!coverImagePath){
        throw new ApiError(400, "cover image not found!")
    }

    const coverImage = await cloudinaryUpload(coverImagePath);

    if(!coverImage.url){
        throw new ApiError(400,"Error in uploading cover image!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url // for cloudinary url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
       new ApiResponse(200,"Cover Image updated succesfully")
    )

})


//mongodb aggregation pipeline implementation

export const getuserChannelProfile = asyncHandler(async(req,res)=>{

    const {username} = req.params // finding the username through link thatswhy params
    console.log(username);

    //optionally checking if username is present with trimming the white spaces
    if(!username?.trim()){
        throw new ApiError(400, "User Name is Missing!")

    }
    
    
    //writing pipeline
    const channel = await User.aggregate([

        //1st pipeline
        {
         //$match for matching username.
            $match:{
                username: username?.toLowerCase()
            }
        },
        
        //2nd pipeline
        //lookup used for joining 
        //to count how many subscribers it has through channel
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "Subscribers"
                }
            },
       
        //3rd pipeline  
        //to count how many channel you have subscribed using subscriber count
            {
                $lookup:{
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "SubscribedTO"
                }
            },

        //4th pipeline
        //$addFields add more fields to the exsisting model
        // added some values to the original user model field
            {
                $addFields:{
                    //to count how many subscriber does the channel have
                    subscribersCount:{
                        $size: "$Subscribers"
                    },
                    //to count how many channels the channel had subscribed
                    channelSubscribedToCount:{
                        $size: "$SubscribedTo"
                    },
                    

                    //validation to check if the user is subscribed or not subscribed
                    issubscribed:{
                        $cond:{ //$cond operator used for condition expression
                            //$in operator can calculate in arrays as well as in objects
                            if:{$in: [req.user?._id, "$Subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },

            //5th pipeline
            //$project is used for projecting all the data, so that frontend devs can pick it up
            {
                $project:{
                    fullName: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount:1,
                    issubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1

                }
            }


        ])

        console.log(channel);

        //logic for checking if we have got an array as response from channel
        if(!channel?.length){
           throw new ApiError(404, "Channel doesnt exist")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, "User data fetched successfully")
        )

});

