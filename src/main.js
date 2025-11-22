import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import ENVIRONMENT from "./config/environment.config.js";
import connectToMongoDB from "./config/configMongoDB.config.js";
import express from 'express';
import { createServer } from 'http';
import authRouter from "./routes/auth.router.js";
import chatRouter from "./routes/chat.router.js";
import messageRouter from "./routes/message.router.js";
import userRouter from "./routes/user.router.js";
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import authMiddleware from "./middlewares/authMiddleware.js";
import logger from './config/logger.js';
import { setupSocketIO } from './socket.js';



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
            'https://app-mensajeria-frontend.vercel.app',
            'https://app-mensajeria-frontend.onrender.com'
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

// Servir archivos estáticos desde la carpeta 'uploads' AUN SIN IMPLEMENTACION EN FRONTEND
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
        message: 'Aplicación mensajería funcionando correctamente',
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

// Configurar Socket.io
let io;
const httpServer = createServer(app);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    io = setupSocketIO(httpServer);
    logger.info('Socket.IO configurado desde archivo dedicado');
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