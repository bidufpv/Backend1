import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import {cloudinaryUpload} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';



// for registering user
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

// findUserId from db
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


// for loginuser
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