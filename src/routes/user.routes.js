import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';

export const userRouter = Router();

// Use userRouter to define routes
userRouter.post('/register', registerUser);
