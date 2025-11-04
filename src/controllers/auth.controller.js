import ENVIRONMENT from "../config/environment.config.js";
import { ServerError } from "../error.js";
import AuthService from "../services/auth.service.js";

class AuthController {
    static async register (request, response){
        try{
            const { email, password, name } = request.body
            
            await AuthService.register(email, password, name)
            response.status(201).json({
                ok: true,
                message: 'Usuario registrado con exito',
                status: 201
            })
        }
        catch(error){
            if(error.status){
                response.status(error.status).json({
                    ok:false,
                    message: error.message,
                    status: error.status
                })
            }
            else{
                console.error(
                    'ERROR AL REGISTRAR', error
                )
                response.status(500).json({
                    ok: false,
                    message: 'Error interno del servidor',
                    status: 500
                })
            }
        }
    }

    static async verifyEmail (request, response){
        try{
            const {verification_token} = request.params

            await AuthService.verifyEmail(verification_token)
            const frontendUrl = process.env.NODE_ENV === 'production' 
                ? process.env.URL_FRONTEND_DEPLOYED 
                : process.env.URL_FRONTEND;

            response.redirect(`${frontendUrl}/login?from=verified_email`)
        }
        catch(error){

            //TODO: Si hay algun fallo reenviar el mail de validacion
            if(error.status){
                response.send(
                    `<h1>${error.message}</h1>`
                )
            }
            else{
                console.error(
                    'ERROR AL REGISTRAR', error
                )

                response.send(
                    `<h1>Error en el servidor, intentelo mas tarde</h1>`
                )
            }
        }
    }

    static async login (request, response){
        try{
            const {email, password} = request.body

            // Validar que se proporcionen email y password
            if (!email || !password) {
                return response.status(400).json({
                    ok: false,
                    message: 'Email y contraseña son requeridos',
                    status: 400
                })
            }

            const { auth_token } = await AuthService.login(email, password)

            response.status(200).json(
                {
                    ok: true, 
                    message: 'Usuario logueado con exito',
                    status: 200,
                    body: {
                        auth_token
                    }
                }
            )
            return 
        }
        catch(error){
            console.error('ERROR AL HACER LOGIN', error)
            if(error.status){
                return response.status(error.status).json({
                    ok:false,
                    message: error.message,
                    status: error.status
                })
            }
            else{
                console.error(
                    'ERROR AL HACER LOGIN (INTERNAL)', error
                )
                return response.status(500).json({
                    ok: false,
                    message: 'Error interno del servidor',
                    status: 500,
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                })
            }
        }
    }

    static async verify (request, response){
        try{
            // El token ya fue verificado por authMiddleware
            const user = request.user

            response.status(200).json({
                ok: true,
                message: 'Token válido',
                status: 200,
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    },
                    token: request.headers.authorization.split(' ')[1]
                }
            })
        }
        catch(error){
            console.error('ERROR AL VERIFICAR TOKEN', error)
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            })
        }
    }
}


export default AuthController