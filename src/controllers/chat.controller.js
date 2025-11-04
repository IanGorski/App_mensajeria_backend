import ChatService from "../services/chat.service.js";

class ChatController {
    static async getAll(request, response) {
        try {
            const { user } = request;
            const chats = await ChatService.getAll(user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Chats obtenidos exitosamente',
                data: chats
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL OBTENER CHATS', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async getById(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            
            const chat = await ChatService.getById(chat_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                data: chat
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL OBTENER CHAT', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async createPrivateChat(request, response) {
        try {
            const { user } = request;
            const { user_id } = request.body;
            
            if (!user_id) {
                return response.status(400).json({
                    ok: false,
                    message: 'user_id es requerido',
                    status: 400
                });
            }
            
            const chat = await ChatService.createPrivateChat(user.id, user_id);
            
            response.status(201).json({
                ok: true,
                status: 201,
                message: 'Chat creado exitosamente',
                data: chat
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL CREAR CHAT PRIVADO', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async createGroupChat(request, response) {
        try {
            const { user } = request;
            const { participants, groupName, groupAvatar } = request.body;
            
            if (!participants || !groupName) {
                return response.status(400).json({
                    ok: false,
                    message: 'participants y groupName son requeridos',
                    status: 400
                });
            }
            
            const chat = await ChatService.createGroupChat(
                user.id, 
                participants, 
                groupName, 
                groupAvatar
            );
            
            response.status(201).json({
                ok: true,
                status: 201,
                message: 'Grupo creado exitosamente',
                data: chat
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL CREAR GRUPO', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async archiveChat(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            
            await ChatService.archiveChat(chat_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Chat archivado exitosamente'
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL ARCHIVAR CHAT', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async deleteChat(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            
            await ChatService.deleteChat(chat_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Chat eliminado exitosamente'
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL ELIMINAR CHAT', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async updateGroupInfo(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            const updates = request.body;
            
            await ChatService.updateGroupInfo(chat_id, user.id, updates);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Información del grupo actualizada exitosamente'
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL ACTUALIZAR GRUPO', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }
}

export default ChatController;
