import User from "../models/User.model.js"

class UserRepository {

    static async create(name, email, password) {
        try {
            return await User.create({
                name: name,
                email: email,
                password: password
            })
        }
        catch (error) {
            console.error('[SERVER ERROR]: no se pudo crear el usuario', error)
            throw error
        }
    }

    static async getAll() {
        try{
            const users = await User.find(
                {
                    active: true
                }
            )
            return users
        }
        catch(error){
            console.error('[SERVER ERROR]: no se pudo obtener la lista de usuarios', error)
            throw error
        }
    }

    static async getById(user_id) {
        try{    
            const user_found = await User.findById(user_id)
            return user_found
        }
        catch(error){
            console.error('[SERVER ERROR]: no se pudo obtener el usuario con id ' + user_id, error)
            throw error
        }
    }

    static async getByEmail (email){
        try {
            const user_found = await User.findOne({
                email: email, 
                active: true
            })
            return user_found
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo obtener el usuario con email ' + email, error)
            throw error
        }
    }

    static async deleteById (user_id){
        const response = await User.findByIdAndDelete(user_id)
        return response
    }

    static async updateById (user_id, update_user){
        await User.findByIdAndUpdate(
            user_id,
            update_user
        )
    }

    static async searchByEmail(email) {
        try {
            const users = await User.find({
                email: { $regex: email, $options: 'i' },
                active: true,
                verified_email: true
            }).select('name email online last_connection');
            return users;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo buscar usuarios por email', error);
            throw error;
        }
    }

    static async updateConnectionStatus(user_id, online, socket_id = null) {
        try {
            const update = {
                online,
                socket_id
            };
            // Solo actualizar la última conexión cuando el usuario se desconecta
            if (!online) {
                update.last_connection = new Date();
            }
            await User.findByIdAndUpdate(user_id, update);
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo actualizar estado de conexión', error);
            throw error;
        }
    }
}


export default UserRepository

