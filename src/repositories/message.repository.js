import Message from "../models/Message.model.js";

class MessageRepository {
    static async create(chat_id, sender_id, content, type = 'text', fileUrl = null) {
        try {
            const message = await Message.create({
                chat_id,
                sender_id,
                content,
                type,
                fileUrl
            });
            
            // Obtener información del sender 
            await message.populate('sender_id', 'name email');
            return message;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo crear el mensaje', error);
            throw error;
        }
    }

    static async getByChatId(chat_id, limit = 50, skip = 0) {
        try {
            const messages = await Message.find({ 
                chat_id, 
                deleted: false 
            })
            .populate('sender_id', 'name email')
            .sort({ created_at: 1 })
            .limit(limit)
            .skip(skip);
            return messages;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudieron obtener los mensajes', error);
            throw error;
        }
    }

    static async getById(message_id) {
        try {
            const message = await Message.findById(message_id)
                .populate('sender_id', 'name email');
            return message;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo obtener el mensaje', error);
            throw error;
        }
    }

    static async markAsRead(message_id, user_id) {
        try {
            const message = await Message.findById(message_id);
            
            // Verificar si ya está marcado como leído
            const alreadyRead = message.read_by.some(
                read => read.user_id.toString() === user_id.toString()
            );
            
            if (!alreadyRead) {
                await Message.findByIdAndUpdate(message_id, {
                    $push: {
                        read_by: {
                            user_id,
                            read_at: new Date()
                        }
                    }
                });
            }
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo marcar como leído', error);
            throw error;
        }
    }

    static async markChatMessagesAsRead(chat_id, user_id) {
        try {
            await Message.updateMany(
                { 
                    chat_id, 
                    deleted: false,
                    'read_by.user_id': { $ne: user_id }
                },
                {
                    $push: {
                        read_by: {
                            user_id,
                            read_at: new Date()
                        }
                    }
                }
            );
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudieron marcar mensajes como leídos', error);
            throw error;
        }
    }

    static async deleteMessage(message_id) {
        try {
            await Message.findByIdAndUpdate(message_id, { deleted: true });
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo eliminar el mensaje', error);
            throw error;
        }
    }

    static async getUnreadCount(chat_id, user_id) {
        try {
            const count = await Message.countDocuments({
                chat_id,
                deleted: false,
                sender_id: { $ne: user_id },
                'read_by.user_id': { $ne: user_id }
            });
            return count;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo obtener el conteo de mensajes no leídos', error);
            throw error;
        }
    }
}

export default MessageRepository;
