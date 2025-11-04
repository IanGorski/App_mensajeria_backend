import ENVIRONMENT from "../config/environment.config.js";
import mailTransporter from "../config/mailTransporter.config.js";
import { ServerError } from "../error.js";
import UserRepository from "../repositories/user.repository.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


class AuthService {
    static async register(email, password, name){
        const user = await UserRepository.getByEmail(email)
        
        if(user){
            throw new ServerError(400, 'Email ya en uso')
        }
    
        const password_hashed = await bcrypt.hash(password, 12)
        const user_created = await UserRepository.create(name, email, password_hashed)
        const user_id_created = user_created._id

        //.sign() se realiza para crear el token
        const verification_token = jwt.sign(
            {
                user_id: user_id_created
            },
            ENVIRONMENT.JWT_SECRET
        )

        await mailTransporter.sendMail({
            from: ENVIRONMENT.GMAIL_USER,
            to: email,
            subject: 'Verifica tu cuenta de mail',
            html: `
                <h1>Verifica tu cuenta de mail</h1>
                <a href="${ENVIRONMENT.URL_BACKEND}/api/auth/verify-email/${verification_token}">Verificar</a>
            `
        })

        return
    }

    static async verifyEmail (verification_token){
        try{
            //Indicador de que el token es valido y está firmado correctamente
            const payload = jwt.verify(
                verification_token, 
                ENVIRONMENT.JWT_SECRET
            )
            const {user_id} = payload
            if(!user_id){
                throw new ServerError(400, 'Accion denegada, token con datos insuficientes')
            } 

            const user_found = await UserRepository.getById(user_id)
            if(!user_found){
                throw new ServerError(404, 'Usuario no encontrado')
            }

            if(user_found.verified_email){
                throw new ServerError(400, 'Usuario ya validado')
            }

            await UserRepository.updateById(user_id, {verified_email: true})

            return 
        }
        catch(error){
            //CHECK si el error es de la verificacion del token 
            if(error instanceof jwt.JsonWebTokenError){
                throw new ServerError(400, 'Accion denegada, token invalido')
            }
            throw error
        }
    }

    static async login (email, password){
        try {
            /*Búsqueda de usuario por mail, validación de existencia y verificación de mail, comparar password recibida con la del usuario y generación de token con datos de sesion*/
            const user_found = await UserRepository.getByEmail(email)
            
            if(!user_found) {
                throw new ServerError(404, 'Usuario con este mail no encontrado')
            }
            
            if(!user_found.verified_email){
                throw new ServerError(401, 'Usuario con mail no verificado')
            }

            const is_same_passoword = await bcrypt.compare( password, user_found.password )
            
            if(!is_same_passoword){
                throw new ServerError(401, 'Contraseña invalida')
            }

            //Creacion del token JWT de autenticacion NO sensible
            const auth_token = jwt.sign(
                {
                    name: user_found.name,
                    email: user_found.email,
                    id: user_found._id,
                },
                ENVIRONMENT.JWT_SECRET,
                {
                    expiresIn: '24h'
                }
            )

            return {
                auth_token: auth_token
            }
        } catch (error) {
            console.error('Error en AuthService.login:', error)
            throw error
        }
    }
}

export default AuthService