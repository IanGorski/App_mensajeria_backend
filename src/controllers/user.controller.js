import UserService from "../services/user.service.js";

class UserController {
    static async searchUsers(request, response) {
        try {
            const { user } = request;
            const { search } = request.query;
            
            if (!search) {
                return response.status(400).json({
                    ok: false,
                    message: 'El parámetro search es requerido',
                    status: 400
                });
            }
            
            const users = await UserService.searchUsers(search, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Usuarios encontrados',
                data: users
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL BUSCAR USUARIOS', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async getUserById(request, response) {
        try {
            const { user_id } = request.params;
            
            const user = await UserService.getUserById(user_id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                data: user
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL OBTENER USUARIO', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }
}

export default UserController;
