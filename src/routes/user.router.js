import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const userRouter = Router();

userRouter.get('/search', authMiddleware, UserController.searchUsers);
userRouter.get('/:user_id', authMiddleware, UserController.getUserById);

export default userRouter;
