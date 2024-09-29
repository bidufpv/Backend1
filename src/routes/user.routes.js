import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';
import {uploadMulter} from '../middlewares/multer.middleware.js';


export const userRouter = Router();

// Use userRouter to define routes
userRouter.post('/register', 
    uploadMulter.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverimage', maxCount: 1}
      ]),
    registerUser);


