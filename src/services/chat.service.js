import ChatRepository from "../repositories/chat.repository.js";
import UserRepository from "../repositories/user.repository.js";
import { ServerError } from "../error.js";
import logger from "../config/logger.js";

class ChatService {
    static async getAll(user_id) {
        try {
            const chats = await ChatRepository.getByUserId(user_id);
            
            // RESET respuesta para frontend
            const formattedChats = chats.map(chat => {
                if (chat.isGroup) {
                    return {
                        id: chat._id,
                        name: chat.groupName,
                        avatar: chat.groupAvatar,
                        lastMessage: chat.lastMessage?.content || '',
                        time: chat.lastMessage?.created_at || chat.created_at,
                        unread: 0, // Se calculará en otro endpoint
                        isGroup: true,
                        participants: chat.participants
                    };
                } else {
                    // Chat privado - obtener info de otros usuarios
                    const otherUser = chat.participants.find(
                        p => p._id.toString() !== user_id.toString()
                    );
                    return {
                        id: chat._id,
                        name: otherUser?.name || 'Usuario desconocido',
                        email: otherUser?.email || '',
                        avatar: otherUser?.avatar || null,
                        online: otherUser?.online || false,
                        last_connection: otherUser?.last_connection || null,
                        lastMessage: chat.lastMessage?.content || '',
                        time: chat.lastMessage?.created_at || chat.created_at,
                        unread: 0, // se calcula en otro ENDPOINT
                        isGroup: false,
                        otherUserId: otherUser?._id
                    };
                }
            });
            
            return formattedChats;
        } catch (error) {
            logger.error('[SERVICE ERROR]: Error al obtener chats', error);
            throw error;
        }
    }

    static async getById(chat_id, user_id) {
        try {
            const chat = await ChatRepository.getById(chat_id);
            
            if (!chat) {
                throw new ServerError(404, 'Chat no encontrado');
            }
            
            // Verificar que el usuario sea participante
            const isParticipant = chat.participants.some(
                p => p._id.toString() === user_id.toString()
            );
            
            if (!isParticipant) {
                throw new ServerError(403, 'No tienes acceso a este chat');
            }
            
            return chat;
        } catch (error) {
            throw error;
        }
    }

    static async createPrivateChat(user1_id, user2_id) {
        try {
            // Verificar que user2 exista
            const user2 = await UserRepository.getById(user2_id);
            if (!user2) {
                throw new ServerError(404, 'Usuario no encontrado');
            }
            
            // Verificar si ya existe un chat entre estos usuarios
            const existingChat = await ChatRepository.findPrivateChat(user1_id, user2_id);
            if (existingChat) {
                return existingChat;
            }
            
            // Crear nuevo chat
            const chat = await ChatRepository.create([user1_id, user2_id], false);
            return chat;
        } catch (error) {
            throw error;
        }
    }

    static async createGroupChat(creator_id, participants, groupName, groupAvatar = null) {
        try {
            if (participants.length < 2) {
                throw new ServerError(400, 'Un grupo debe tener al menos 2 participantes');
            }
            
            // Verificar que todos los participantes existan
            for (const participant_id of participants) {
                const user = await UserRepository.getById(participant_id);
                if (!user) {
                    throw new ServerError(404, `Usuario ${participant_id} no encontrado`);
                }
            }
            
            // Crear grupo con el creador como admin
            const chat = await ChatRepository.create(
                [creator_id, ...participants],
                true,
                { 
                    groupName, 
                    groupAvatar, 
                    groupAdmin: creator_id 
                }
            );
            
            return chat;
        } catch (error) {
            throw error;
        }
    }

    static async archiveChat(chat_id, user_id) {
        try {
            // Verificar que el usuario sea participante
            await this.getById(chat_id, user_id);
            await ChatRepository.archiveChat(chat_id);
        } catch (error) {
            throw error;
        }
    }

    static async deleteChat(chat_id, user_id) {
        try {
            // Verificar que el usuario sea participante
            await this.getById(chat_id, user_id);
            await ChatRepository.deleteChat(chat_id);
        } catch (error) {
            throw error;
        }
    }

    static async updateGroupInfo(chat_id, user_id, updates) {
        try {
            const chat = await this.getById(chat_id, user_id);
            
            // Verificar que sea un grupo
            if (!chat.isGroup) {
                throw new ServerError(400, 'Esta acción solo es válida para grupos');
            }
            
            // Verificar que el usuario sea admin
            if (chat.groupAdmin.toString() !== user_id.toString()) {
                throw new ServerError(403, 'Solo el administrador puede actualizar el grupo');
            }
            
            await ChatRepository.updateGroupInfo(chat_id, updates);
        } catch (error) {
            throw error;
        }
    }
}

export default ChatService;
