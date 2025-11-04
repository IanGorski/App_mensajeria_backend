import Chat from "../models/Chat.model.js";

class ChatRepository {
    static async create(participants, isGroup = false, groupData = {}) {
        try {
            const chat = await Chat.create({
                participants,
                isGroup,
                ...groupData
            });
            return chat;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo crear el chat', error);
            throw error;
        }
    }

    static async getByUserId(user_id) {
        try {
            const chats = await Chat.find({
                participants: user_id,
                archived: false,
                active: true
            })
            .populate('participants', 'name email')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender_id',
                    select: 'name'
                }
            })
            .sort({ 'created_at': -1 });
            return chats;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudieron obtener los chats', error);
            throw error;
        }
    }

    static async getById(chat_id) {
        try {
            const chat = await Chat.findById(chat_id)
                .populate('participants', 'name email');
            return chat;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo obtener el chat', error);
            throw error;
        }
    }

    static async findPrivateChat(user1_id, user2_id) {
        try {
            const chat = await Chat.findOne({
                isGroup: false,
                participants: { $all: [user1_id, user2_id], $size: 2 }
            });
            return chat;
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo encontrar el chat privado', error);
            throw error;
        }
    }

    static async updateLastMessage(chat_id, message_id) {
        try {
            await Chat.findByIdAndUpdate(chat_id, { 
                lastMessage: message_id 
            });
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo actualizar el último mensaje', error);
            throw error;
        }
    }

    static async archiveChat(chat_id) {
        try {
            await Chat.findByIdAndUpdate(chat_id, { archived: true });
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo archivar el chat', error);
            throw error;
        }
    }

    static async deleteChat(chat_id) {
        try {
            await Chat.findByIdAndUpdate(chat_id, { active: false });
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo eliminar el chat', error);
            throw error;
        }
    }

    static async updateGroupInfo(chat_id, updates) {
        try {
            await Chat.findByIdAndUpdate(chat_id, updates);
        } catch (error) {
            console.error('[SERVER ERROR]: no se pudo actualizar la información del grupo', error);
            throw error;
        }
    }
}

export default ChatRepository;
