import MessageService from "../services/message.service.js";

class MessageController {
    static async getMessages(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            const { limit = 300, skip = 0 } = request.query;
            
            const messages = await MessageService.getMessages(
                chat_id, 
                user.id, 
                parseInt(limit), 
                parseInt(skip)
            );
            
            response.status(200).json({
                ok: true,
                status: 200,
                data: messages
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL OBTENER MENSAJES', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async sendMessage(request, response) {
        try {
            const { user } = request;
            const { chat_id, content, type, fileUrl } = request.body;
            
            if (!chat_id || !content) {
                return response.status(400).json({
                    ok: false,
                    message: 'chat_id y content son requeridos',
                    status: 400
                });
            }
            
            const message = await MessageService.sendMessage(
                chat_id, 
                user.id, 
                content, 
                type, 
                fileUrl
            );
            
            response.status(201).json({
                ok: true,
                status: 201,
                message: 'Mensaje enviado exitosamente',
                data: message
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL ENVIAR MENSAJE', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async markAsRead(request, response) {
        try {
            const { user } = request;
            const { message_id } = request.params;
            
            await MessageService.markAsRead(message_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Mensaje marcado como leído'
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL MARCAR MENSAJE COMO LEÍDO', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async markChatAsRead(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            
            await MessageService.markChatMessagesAsRead(chat_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Todos los mensajes marcados como leídos'
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL MARCAR CHAT COMO LEÍDO', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async deleteMessage(request, response) {
        try {
            const { user } = request;
            const { message_id } = request.params;
            
            await MessageService.deleteMessage(message_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                message: 'Mensaje eliminado exitosamente'
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL ELIMINAR MENSAJE', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }

    static async getUnreadCount(request, response) {
        try {
            const { user } = request;
            const { chat_id } = request.params;
            
            const count = await MessageService.getUnreadCount(chat_id, user.id);
            
            response.status(200).json({
                ok: true,
                status: 200,
                data: { count }
            });
        } catch (error) {
            if (error.status) {
                return response.status(error.status).json({
                    ok: false,
                    message: error.message,
                    status: error.status
                });
            }
            console.error('ERROR AL OBTENER CONTEO DE NO LEÍDOS', error);
            response.status(500).json({
                ok: false,
                message: 'Error interno del servidor',
                status: 500
            });
        }
    }
}

export default MessageController;
