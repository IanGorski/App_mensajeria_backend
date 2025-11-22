import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import ENVIRONMENT from './config/environment.config.js';
import UserRepository from './repositories/user.repository.js';
import ChatRepository from './repositories/chat.repository.js';
import MessageService from './services/message.service.js';
import logger from './config/logger.js';

/**
 * Configurar y gestionar Socket.IO
 * @param {Server} httpServer - Servidor HTTP de Express
 * @returns {Server} Instancia de Socket.IO configurada
 */
export const setupSocketIO = (httpServer) => {
    // Permitir orígenes locales y el configurado por entorno
    const allowedSocketOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        ENVIRONMENT.URL_FRONTEND,
        'https://app-mensajeria-frontend.vercel.app',
        'https://app-mensajeria-frontend.onrender.com'
    ].filter(Boolean);

    const io = new Server(httpServer, {
        cors: {
            origin: allowedSocketOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware de autenticación para Socket.IO
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Token no proporcionado'));
            }

            const decoded = jwt.verify(token, ENVIRONMENT.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Token inválido'));
        }
    });

    // Eventos de Socket.IO
    io.on('connection', async (socket) => {
        logger.info(`[SOCKET] Usuario conectado: ${socket.user.name} (ID: ${socket.user.id}, Socket: ${socket.id})`);
        
        // Actualizar estado de conexión del usuario
        await UserRepository.updateConnectionStatus(socket.user.id, true, socket.id);
        logger.info(`[DB] Estado de conexión actualizado para ${socket.user.name} (online: true)`);
        
        // Unir al usuario a su sala personal
        socket.join(`user_${socket.user.id}`);
        
        // Obtener los chats del usuario y unirse a sus salas
        try {
            const userChats = await ChatRepository.getByUserId(socket.user.id);
            logger.info(`[SOCKET] ${socket.user.name} tiene ${userChats.length} chat(s) activo(s)`);
            userChats.forEach(chat => {
                socket.join(`chat_${chat._id}`);
                logger.info(`[SOCKET] Usuario ${socket.user.name} se unió al chat ${chat._id}`);
            });
        } catch (error) {
            logger.error(`[SOCKET ERROR] Error al unir usuario ${socket.user.name} a sus chats:`, error);
        }
        
        // Notificar a todos los contactos que el usuario está online
        try {
            const userChats = await ChatRepository.getByUserId(socket.user.id);
            logger.info(`[SOCKET] Notificando estado online de ${socket.user.name} a ${userChats.length} chat(s)`);
            userChats.forEach(chat => {
                socket.to(`chat_${chat._id}`).emit('userStatusChanged', {
                    user_id: socket.user.id,
                    online: true
                });
            });
        } catch (error) {
            logger.error(`[SOCKET ERROR] Error al notificar estado online de ${socket.user.name}:`, error);
        }

        // Sync inicial de estados para el cliente conectado
        try {
            const userChats = await ChatRepository.getByUserId(socket.user.id);
            const statusMap = {};
            userChats.forEach(chat => {
                chat.participants.forEach(p => {
                    if (p._id.toString() !== socket.user.id.toString()) {
                        statusMap[p._id] = {
                            online: !!p.online,
                            last_connection: p.last_connection || null
                        };
                    }
                });
            });
            const userCount = Object.keys(statusMap).length;
            logger.info(`[SOCKET] Enviando statusSync a ${socket.user.name} con ${userCount} usuario(s)`);
            socket.emit('statusSync', statusMap);
        } catch (error) {
            logger.error(`[SOCKET ERROR] Error preparando statusSync para ${socket.user.name}:`, error);
        }
        
        // Unirse a salas de chats
        socket.on('joinChat', (chat_id) => {
            socket.join(`chat_${chat_id}`);
            logger.info(`[SOCKET] Usuario ${socket.user.name} se unió al chat ${chat_id}`);
        });
        
        // Enviar mensaje
        socket.on('sendMessage', async (data) => {
            const startTime = Date.now();
            try {
                const { chat_id, content, type, fileUrl, client_id } = data;
                
                logger.info(`[SOCKET] ${socket.user.name} enviando mensaje (tipo: ${type}) al chat ${chat_id}`);
                
                // Guardar mensaje en BD
                const message = await MessageService.sendMessage(
                    chat_id,
                    socket.user.id,
                    content,
                    type,
                    fileUrl
                );
                logger.info(`[DB] Mensaje guardado exitosamente (ID: ${message._id})`);
                
                // Actualizar el lastMessage del chat
                await ChatRepository.updateLastMessage(chat_id, message._id);
                
                // Preparar objeto de mensaje para emitir
                const messageToEmit = {
                    ...message.toObject(),
                    sender: {
                        id: socket.user.id,
                        _id: socket.user.id,
                        name: socket.user.name
                    },
                    sender_id: {
                        _id: socket.user.id,
                        name: socket.user.name
                    },
                    client_id: client_id || null
                };
                
                //Emitir a todos los participantes del chat (incluyendo el remitente)
                io.to(`chat_${chat_id}`).emit('receiveMessage', messageToEmit);
                
                const duration = Date.now() - startTime;
                logger.info(`[SOCKET] Mensaje enviado exitosamente en ${duration}ms (Chat: ${chat_id}, Mensaje: ${message._id})`);
            } catch (error) {
                logger.error(`[SOCKET ERROR] Error al enviar mensaje de ${socket.user.name}:`, error);
                socket.emit('error', { message: 'Error al enviar mensaje', details: error.message });
            }
        });

        // Petición explícita de sync de estados desde el cliente
        socket.on('requestStatusSync', async () => {
            try {
                logger.info(`[SOCKET] ${socket.user.name} solicitó sync de estados`);
                const userChats = await ChatRepository.getByUserId(socket.user.id);
                const statusMap = {};
                userChats.forEach(chat => {
                    chat.participants.forEach(p => {
                        if (p._id.toString() !== socket.user.id.toString()) {
                            statusMap[p._id] = {
                                online: !!p.online,
                                last_connection: p.last_connection || null
                            };
                        }
                    });
                });
                logger.info(`[SOCKET] Enviando statusSync a ${socket.user.name} con ${Object.keys(statusMap).length} usuario(s)`);
                socket.emit('statusSync', statusMap);
            } catch (error) {
                logger.error(`[SOCKET ERROR] Error al procesar requestStatusSync de ${socket.user.name}:`, error);
            }
        });
        
        // Escribiendo
        socket.on('typing', (data) => {
            const { chat_id } = data;
            logger.info(`[SOCKET] ${socket.user.name} está escribiendo en chat ${chat_id}`);
            socket.to(`chat_${chat_id}`).emit('userTyping', {
                user_id: socket.user.id,
                user_name: socket.user.name,
                chat_id
            });
        });
        
        // Dejar de escribir
        socket.on('stopTyping', (data) => {
            const { chat_id } = data;
            logger.info(`[SOCKET] ${socket.user.name} dejó de escribir en chat ${chat_id}`);
            socket.to(`chat_${chat_id}`).emit('userStoppedTyping', {
                user_id: socket.user.id,
                chat_id
            });
        });
        
        // Marcar mensajes como leídos
        socket.on('markAsRead', async (data) => {
            try {
                const { chat_id } = data;
                logger.info(`[SOCKET] ${socket.user.name} marcando mensajes como leídos en chat ${chat_id}`);
                await MessageService.markChatAsRead(chat_id, socket.user.id);
                logger.info(`[DB] Mensajes marcados como leídos por ${socket.user.name} en chat ${chat_id}`);
                
                // Notificar a otros usuarios del chat
                socket.to(`chat_${chat_id}`).emit('messagesRead', {
                    user_id: socket.user.id,
                    chat_id
                });
            } catch (error) {
                logger.error(`[SOCKET ERROR] Error al marcar como leído (Usuario: ${socket.user.name}, Chat: ${chat_id}):`, error);
            }
        });
        
        // Desconexión
        socket.on('disconnect', async () => {
            const disconnectTime = new Date();
            logger.info(`[SOCKET] Usuario desconectado: ${socket.user.name} (ID: ${socket.user.id}, Socket: ${socket.id})`);
            
            // Actualizar estado de conexión del usuario
            await UserRepository.updateConnectionStatus(socket.user.id, false, null);
            logger.info(`[DB] Estado de conexión actualizado para ${socket.user.name} (online: false)`);
            
            // Notificar a todos los contactos que el usuario está offline
            try {
                const userChats = await ChatRepository.getByUserId(socket.user.id);
                logger.info(`[SOCKET] Notificando estado offline de ${socket.user.name} a ${userChats.length} chat(s)`);
                userChats.forEach(chat => {
                    socket.to(`chat_${chat._id}`).emit('userStatusChanged', {
                        user_id: socket.user.id,
                        online: false,
                        last_connection: disconnectTime
                    });
                });
            } catch (error) {
                logger.error(`[SOCKET ERROR] Error al notificar estado offline de ${socket.user.name}:`, error);
            }
        });
    });

    return io;
};
