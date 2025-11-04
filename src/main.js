import ENVIRONMENT from "./config/environment.config.js";
import connectToMongoDB from "./config/configMongoDB.config.js";
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from "./routes/auth.router.js";
import chatRouter from "./routes/chat.router.js";
import messageRouter from "./routes/message.router.js";
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import authMiddleware from "./middlewares/authMiddleware.js";
import MessageService from "./services/message.service.js";

// Conectar a MongoDB
connectToMongoDB();

const app = express();
const httpServer = createServer(app);

// Configurar Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: ENVIRONMENT.URL_FRONTEND || '*',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Configurar CORS
app.use(cors());

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
        console.error('ERROR AL SUBIR ARCHIVO', error);
        res.status(500).json({
            ok: false,
            message: 'Error al subir archivo'
        });
    }
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error('ERROR:', err);
    res.status(err.status || 500).json({
        ok: false,
        message: err.message || 'Error interno del servidor',
    });
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

io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.user.name} (${socket.user.id})`);
    
    // Unir al usuario a su sala personal
    socket.join(`user_${socket.user.id}`);
    
    // Unirse a salas de chats
    socket.on('joinChat', (chat_id) => {
        socket.join(`chat_${chat_id}`);
        console.log(`Usuario ${socket.user.name} se unió al chat ${chat_id}`);
    });
    
    // Enviar mensaje
    socket.on('sendMessage', async (data) => {
        try {
            const { chat_id, content, type, fileUrl } = data;
            
            // Guardar mensaje en BD
            const message = await MessageService.sendMessage(
                chat_id,
                socket.user.id,
                content,
                type,
                fileUrl
            );
            
            // Emitir a todos los participantes del chat
            io.to(`chat_${chat_id}`).emit('receiveMessage', message);
            
            console.log(`Mensaje enviado en chat ${chat_id} por ${socket.user.name}`);
        } catch (error) {
            console.error('ERROR AL ENVIAR MENSAJE:', error);
            socket.emit('error', { message: 'Error al enviar mensaje' });
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
    
    // Desconexión
    socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.user.name}`);
    });
});

// Iniciar servidor
httpServer.listen(ENVIRONMENT.PORT || 3000, () => {
    console.log(`🚀 Servidor corriendo en puerto ${ENVIRONMENT.PORT || 3000}`);
    console.log(`📡 Socket.io configurado correctamente`);
});

export { io };