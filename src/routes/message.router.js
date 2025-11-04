import { Router } from "express";
import MessageController from "../controllers/message.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const messageRouter = Router();

// Obtener mensajes de un chat
messageRouter.get(
    '/:chat_id',
    authMiddleware,
    MessageController.getMessages
);

// Enviar un mensaje
messageRouter.post(
    '/',
    authMiddleware,
    MessageController.sendMessage
);

// Marcar un mensaje como leído
messageRouter.put(
    '/:message_id/read',
    authMiddleware,
    MessageController.markAsRead
);

// Marcar todos los mensajes de un chat como leídos
messageRouter.put(
    '/chat/:chat_id/read',
    authMiddleware,
    MessageController.markChatAsRead
);

// Eliminar un mensaje
messageRouter.delete(
    '/:message_id',
    authMiddleware,
    MessageController.deleteMessage
);

// Obtener conteo de mensajes no leídos en un chat
messageRouter.get(
    '/chat/:chat_id/unread',
    authMiddleware,
    MessageController.getUnreadCount
);

export default messageRouter;
