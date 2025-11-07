import MessageRepository from "../repositories/message.repository.js";
import ChatRepository from "../repositories/chat.repository.js";
import ChatService from "./chat.service.js";
import { ServerError } from "../error.js";

class MessageService {
    static async sendMessage(chat_id, sender_id, content, type = 'text', fileUrl = null) {
        try {
            // Verificar que el usuario sea participante del chat
            await ChatService.getById(chat_id, sender_id);
            
            // Crear mensaje
            const message = await MessageRepository.create(
                chat_id, 
                sender_id, 
                content, 
                type, 
                fileUrl
            );
            
            // Actualizar último mensaje del chat
            await ChatRepository.updateLastMessage(chat_id, message._id);
            
            return message;
        } catch (error) {
            throw error;
        }
    }

    static async getMessages(chat_id, user_id, limit = 300, skip = 0) {
        try {
            // Verificar que el usuario sea participante del chat
            await ChatService.getById(chat_id, user_id);
            
            // Obtener mensajes
            const messages = await MessageRepository.getByChatId(chat_id, limit, skip);
            
            return messages;
        } catch (error) {
            throw error;
        }
    }

    static async markAsRead(message_id, user_id) {
        try {
            const message = await MessageRepository.getById(message_id);
            
            if (!message) {
                throw new ServerError(404, 'Mensaje no encontrado');
            }
            
            // Verificar que el usuario sea participante del chat
            await ChatService.getById(message.chat_id.toString(), user_id);
            
            // Marcar como leído
            await MessageRepository.markAsRead(message_id, user_id);
        } catch (error) {
            throw error;
        }
    }

    static async markChatMessagesAsRead(chat_id, user_id) {
        try {
            // Verificar que el usuario sea participante del chat
            await ChatService.getById(chat_id, user_id);
            
            // Marcar todos los mensajes del chat como leídos
            await MessageRepository.markChatMessagesAsRead(chat_id, user_id);
        } catch (error) {
            throw error;
        }
    }

    static async markChatAsRead(chat_id, user_id) {
        try {
            // Verificar que el usuario sea participante del chat
            await ChatService.getById(chat_id, user_id);
            
            // Marcar todos los mensajes del chat como leídos
            await MessageRepository.markChatMessagesAsRead(chat_id, user_id);
        } catch (error) {
            throw error;
        }
    }

    static async deleteMessage(message_id, user_id) {
        try {
            const message = await MessageRepository.getById(message_id);
            
            if (!message) {
                throw new ServerError(404, 'Mensaje no encontrado');
            }
            
            // Verificar que el usuario sea el sender o admin del grupo
            if (message.sender_id._id.toString() !== user_id.toString()) {
                throw new ServerError(403, 'No puedes eliminar este mensaje');
            }
            
            await MessageRepository.deleteMessage(message_id);
        } catch (error) {
            throw error;
        }
    }

    static async getUnreadCount(chat_id, user_id) {
        try {
            // Verificar que el usuario sea participante del chat
            await ChatService.getById(chat_id, user_id);
            
            const count = await MessageRepository.getUnreadCount(chat_id, user_id);
            return count;
        } catch (error) {
            throw error;
        }
    }
}

export default MessageService;
