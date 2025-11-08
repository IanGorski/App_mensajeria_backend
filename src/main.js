import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import ENVIRONMENT from "./config/environment.config.js";
import connectToMongoDB from "./config/configMongoDB.config.js";
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from "./routes/auth.router.js";
import chatRouter from "./routes/chat.router.js";
import messageRouter from "./routes/message.router.js";
import userRouter from "./routes/user.router.js";
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import authMiddleware from "./middlewares/authMiddleware.js";
import MessageService from "./services/message.service.js";
import UserRepository from "./repositories/user.repository.js";
import ChatRepository from "./repositories/chat.repository.js";
import logger from './config/logger.js';



const app = express();

// Middleware para conectar a MongoDB antes de cada solicitud
app.use(async (req, res, next) => {
    try {
        await connectToMongoDB();
        next();
    } catch (error) {
        logger.error('Error al conectar con MongoDB:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error de conexión con la base de datos',
            status: 500,
            error: error.message
        });
    }
});

// Configurar CORS ANTES de las rutas
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'https://app-mensajeria-frontend.vercel.app'
        ];
        
        // Permitir requests sin origin (como aplicaciones móviles o Postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Configurar express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads) desde la carpeta 'uploads' AUN SIN IMPLEMENTACION EN FRONTEND
app.use('/uploads', express.static('uploads'));

// Configurar multer para subida de archivos, idem linea 38
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp3|mp4|wav/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.json({
        ok: true,
        message: 'Backend aplicación mensajería funcionando correctamente',
        version: '3.0.0',
        endpoints: {
            auth: '/api/auth',
            chats: '/api/chats',
            messages: '/api/messages',
            upload: '/api/upload'
        }
    });
});

// Rutas de API
app.use('/api/auth', authRouter);
app.use('/api/chats', chatRouter);
app.use('/api/messages', messageRouter);
app.use('/api/users', userRouter);

// Ruta para subir archivos
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                ok: false,
                message: 'No se proporcionó ningún archivo'
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            ok: true,
            message: 'Archivo subido exitosamente',
            data: {
                fileUrl,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        logger.error('ERROR AL SUBIR ARCHIVO', error);
        res.status(500).json({
            ok: false,
            message: 'Error al subir archivo'
        });
    }
});

// Configurar Socket.io solo en desarrollo (Vercel no soporta WebSockets persistentes)
let io;
let httpServer;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    httpServer = createServer(app);
    
    // Permitir orígenes locales y el configurado por entorno
    const allowedSocketOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        ENVIRONMENT.URL_FRONTEND
    ].filter(Boolean);

    io = new Server(httpServer, {
        cors: {
            origin: allowedSocketOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Configurar Socket.io
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
        
        // Unirse a salas de chats (para nuevos chats creados después de conectarse)
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
                    // Devolver el client_id para poder conciliar el mensaje optimista en el cliente
                    client_id: client_id || null
                };
                
                // Emitir a todos los participantes del chat (incluyendo el remitente)
                io.to(`chat_${chat_id}`).emit('receiveMessage', messageToEmit);
                
                logger.info(`Mensaje enviado exitosamente en chat ${chat_id}`);
            } catch (error) {
                logger.error('ERROR AL ENVIAR MENSAJE:', error);
                socket.emit('error', { message: 'Error al enviar mensaje', details: error.message });
            }
        });

        // Petición explícita de sync de estados desde el cliente
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
}

// Middleware para manejar errores
app.use((err, req, res, next) => {
    logger.error('ERROR:', err);
    res.status(err.status || 500).json({
        ok: false,
        message: err.message || 'Error interno del servidor',
    });
});

// Iniciar servidor solo si no está en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const server = httpServer || createServer(app);
    server.listen(ENVIRONMENT.PORT || 3000, () => {
        logger.info(`Servidor corriendo en puerto ${ENVIRONMENT.PORT || 3000}`);
        if (io) {
            logger.info(`Socket.io configurado correctamente`);
        }
    });
}

// Exportar la app para Vercel
export default app;
export { io };