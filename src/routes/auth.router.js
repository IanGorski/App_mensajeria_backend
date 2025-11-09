import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validateRequest.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Joi from 'joi'
import { validateRequestBody } from "../middlewares/validateRequest.middleware.js";


const authRouter = Router()


authRouter.post(
    '/register',
    validateRequest(registerSchema),
    AuthController.register
)

authRouter.get(
    '/verify-email/:verification_token',
    AuthController.verifyEmail
)

authRouter.post(
    '/login',
    validateRequest(loginSchema),
    AuthController.login
)

// Recuperación de contraseña
authRouter.post(
    '/forgot-password',
    validateRequestBody(Joi.object({ email: Joi.string().email().required() })),
    AuthController.forgotPassword
)

authRouter.post(
    '/reset-password',
    validateRequestBody(Joi.object({ token: Joi.string().required(), password: Joi.string().min(6).required() })),
    AuthController.resetPassword
)

authRouter.get(
    '/reset-password/validate/:token',
    AuthController.validateResetToken
)

authRouter.get(
    '/verify',
    authMiddleware,
    AuthController.verify
)

export default authRouter