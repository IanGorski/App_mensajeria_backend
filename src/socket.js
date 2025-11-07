import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import ENVIRONMENT from './config/environment.config.js';
import connectToMongoDB from './config/configMongoDB.config.js';
import MessageService from './services/message.service.js';
import UserRepository from './repositories/user.repository.js';
import ChatRepository from './repositories/chat.repository.js';
import logger from './config/logger.js';

// Conectar a MongoDB
await connectToMongoDB();

// Crear servidor HTTP para Socket.io
const httpServer = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        ok: true,
        message: 'Servidor WebSocket funcionando',
        service: 'socket.io',
        timestamp: new Date().toISOString()
    }));
});

// Configurar Socket orígenes
const allowedSocketOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.URL_FRONTEND,
    'https://app-mensajeria-frontend.vercel.app'
].filter(Boolean);

// Configurar Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: allowedSocketOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware de autenticación para Socket.io
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

// Eventos de Socket.io
io.on('connection', async (socket) => {
    logger.info(`Usuario conectado: ${socket.user.name} (${socket.user.id})`);
    
    // Actualizar estado de conexión del usuario
    await UserRepository.updateConnectionStatus(socket.user.id, true, socket.id);
    
    // Unir al usuario a su sala personal
    socket.join(`user_${socket.user.id}`);
    
    // Obtener los chats del usuario y unirse a sus salas
    try {
        const userChats = await ChatRepository.getByUserId(socket.user.id);
        userChats.forEach(chat => {
            socket.join(`chat_${chat._id}`);
            logger.info(`Usuario ${socket.user.name} se unió al chat ${chat._id}`);
        });
    } catch (error) {
        logger.error('Error al unir usuario a sus chats:', error);
    }
    
    // Notificar a todos los contactos que el usuario está online
    try {
        const userChats = await ChatRepository.getByUserId(socket.user.id);
        userChats.forEach(chat => {
            socket.to(`chat_${chat._id}`).emit('userStatusChanged', {
                user_id: socket.user.id,
                online: true
            });
        });
    } catch (error) {
        logger.error('Error al notificar estado online:', error);
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
        socket.emit('statusSync', statusMap);
    } catch (error) {
        logger.error('Error preparando statusSync inicial:', error);
    }
    
    // Unirse a salas de chats
    socket.on('joinChat', (chat_id) => {
        socket.join(`chat_${chat_id}`);
        logger.info(`Usuario ${socket.user.name} se unió al chat ${chat_id}`);
    });
    
    // Enviar mensaje
    socket.on('sendMessage', async (data) => {
        try {
            const { chat_id, content, type, fileUrl, client_id } = data;
            
            logger.info(`Enviando mensaje en chat ${chat_id} desde usuario ${socket.user.name}`);
            
            // Guardar mensaje en BD
            const message = await MessageService.sendMessage(
                chat_id,
                socket.user.id,
                content,
                type,
                fileUrl
            );
            
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
            
            // Emitir a todos los participantes del chat
            io.to(`chat_${chat_id}`).emit('receiveMessage', messageToEmit);
            
            logger.info(`Mensaje enviado exitosamente en chat ${chat_id}`);
        } catch (error) {
            logger.error('ERROR AL ENVIAR MENSAJE:', error);
            socket.emit('error', { message: 'Error al enviar mensaje', details: error.message });
        }
    });

    // Reenviar mensajes recientes al cliente que se conecta tarde
    socket.on('requestRecentMessages', async (chat_id) => {
        try {
            const recentMessages = await MessageService.getMessages(chat_id, socket.user.id, 50, 0); // Últimos 50 mensajes
            socket.emit('recentMessages', { chat_id, messages: recentMessages });
        } catch (error) {
            logger.error('ERROR AL OBTENER MENSAJES RECIENTES:', error);
            socket.emit('error', { message: 'Error al obtener mensajes recientes', details: error.message });
        }
    });

    // Petición de sync de estados
    socket.on('requestStatusSync', async () => {
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
            socket.emit('statusSync', statusMap);
        } catch (error) {
            logger.error('Error al procesar requestStatusSync:', error);
        }
    });
    
    // Escribiendo...
    socket.on('typing', (data) => {
        const { chat_id } = data;
        socket.to(`chat_${chat_id}`).emit('userTyping', {
            user_id: socket.user.id,
            user_name: socket.user.name,
            chat_id
        });
    });
    
    // Dejar de escribir
    socket.on('stopTyping', (data) => {
        const { chat_id } = data;
        socket.to(`chat_${chat_id}`).emit('userStoppedTyping', {
            user_id: socket.user.id,
            chat_id
        });
    });
    
    // Marcar mensajes como leídos
    socket.on('markAsRead', async (data) => {
        try {
            const { chat_id } = data;
            await MessageService.markChatAsRead(chat_id, socket.user.id);
            
            // Notificar a otros usuarios del chat
            socket.to(`chat_${chat_id}`).emit('messagesRead', {
                user_id: socket.user.id,
                chat_id
            });
        } catch (error) {
            logger.error('ERROR AL MARCAR COMO LEÍDO:', error);
        }
    });
    
    // Desconexión
    socket.on('disconnect', async () => {
        logger.info(`Usuario desconectado: ${socket.user.name}`);
        
        // Actualizar estado de conexión del usuario
        await UserRepository.updateConnectionStatus(socket.user.id, false, null);
        
        // Notificar a todos los contactos que el usuario está offline
        try {
            const userChats = await ChatRepository.getByUserId(socket.user.id);
            userChats.forEach(chat => {
                socket.to(`chat_${chat._id}`).emit('userStatusChanged', {
                    user_id: socket.user.id,
                    online: false,
                    last_connection: new Date()
                });
            });
        } catch (error) {
            logger.error('Error al notificar estado offline:', error);
        }
    });
});

// Iniciar servidor
// Render usa la variable PORT, no SOCKET_PORT
const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
    logger.info(`Servidor WebSocket corriendo en puerto ${PORT}`);
    logger.info(`Socket.io configurado correctamente`);
    logger.info(`Orígenes permitidos: ${allowedSocketOrigins.join(', ')}`);
});

export { io, httpServer };
