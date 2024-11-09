import { Router } from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js';
import {uploadMulter} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { accessRefreshToken, changeCurrentPassword } from '../controllers/user.controller.js';


export const userRouter = Router();

// Use userRouter to define routes
userRouter.post('/register', 
    uploadMulter.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverimage', maxCount: 1}
      ]),
    registerUser);

userRouter.route('/login').post(loginUser)

//secured routes
userRouter.route('/logout').post(verifyJWT, logoutUser)
userRouter.route('/refreshtoken').post(accessRefreshToken)
userRouter.route('/passwordChange').post(verifyJWT, changeCurrentPassword)


