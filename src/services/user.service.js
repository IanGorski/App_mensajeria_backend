import UserRepository from "../repositories/user.repository.js";
import { ServerError } from "../error.js";

class UserService {
    static async searchUsers(searchTerm, currentUserId) {
        try {
            if (!searchTerm || searchTerm.length < 3) {
                throw new ServerError(400, 'El término de búsqueda debe tener al menos 3 caracteres');
            }
            
            const users = await UserRepository.searchByEmail(searchTerm);
            
            // Filtrar el usuario actual de los resultados
            const filteredUsers = users.filter(
                user => user._id.toString() !== currentUserId.toString()
            );
            
            return filteredUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                online: user.online,
                last_connection: user.last_connection
            }));
        } catch (error) {
            throw error;
        }
    }

    static async getUserById(user_id) {
        try {
            const user = await UserRepository.getById(user_id);
            
            if (!user) {
                throw new ServerError(404, 'Usuario no encontrado');
            }
            
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                online: user.online,
                last_connection: user.last_connection
            };
        } catch (error) {
            throw error;
        }
    }
}

export default UserService;
